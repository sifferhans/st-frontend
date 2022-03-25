import {
    Collection,
    CollectionItem,
    Lyrics,
    Song,
    Tag,
    User,
    MediaFile,
} from "@/classes";
import { ICollectionItem, ApiContributor, ICustomCollection, ITag, ShareKey } from "songtreasures-api";
import { analytics, items, playlists, session, sharing, songs, tags } from "./api";
import auth, { analytics as googleAnalytics } from "./auth";
import { cache } from "./cache";
import { notify } from "./notify";
import Favorites from "@/classes/favorites";
import Instrument from "@/classes/instrument";
import { Language } from "songtreasures";
import collectionService from "./collectionService";
import { ISong } from "hiddentreasures-js";

export class Session {
    private _initialized?: boolean;

    private _user?: User;

    private get expiry() {
        return new Date().getTime() + 3600000;
    }

    private _preFetch = [
        async () => {
            this.languages = (await cache.getOrCreateAsync("languages", items.getLanguages, this.expiry)) ?? [];
        },
        async () => {
            const obj: {
                [key: string]: ITag;
            } = {};
            const getTags = async () => (await tags.getAll()).reduce((a, b) => { a[b.id] = b; return a; }, obj);
            this.tags = (await cache.getOrCreateHashAsync("tags", getTags, new Date().getTime() + 60000)).map(i => new Tag(i)) ?? [];
        },
        async () => {
            const obj: {
                [key: string]: ICustomCollection;
            } = {};
            const getCustomCollections = async () => (await playlists.getPlaylists()).reduce((a, b) => { a[b.id] = b; return a; }, obj);
            this.customCollections = (await cache.getOrCreateHashAsync("custom_collections", getCustomCollections, new Date().getTime() + 60000) ?? []);
        },
    ];

    public get user() {
        if (!this._user) {
            throw new Error("User isn't set");
        }
        return this._user;
    }
    
    public set user(v) {
        this._user = v;
    }

    public get User() {
        return this._user ?? null;
    }


    public songs: Song[] = [];
    public collections: Collection[] = [];
    public files: MediaFile[] = [];
    public contributors: CollectionItem<ApiContributor>[] = [];
    

    public instruments: Instrument[] = [];

    public favorites = new Favorites();

    public tags: Tag[] = [];
    public customCollections: ICustomCollection[] = [];
    public languages: Language[] = [];

    public lyrics: Lyrics[] = [];

    public get initialized() {
        return this._initialized === true;
    }

    public async init() {
        if (this._initialized === false) {
            while (this._initialized === false) {
                await new Promise(r => setTimeout(r, 100));
            }
            return;
        }
        if (this.initialized)
            return;

        await this.favorites.init();


        const user = await cache.getOrCreateAsync("user", session.getCurrentUser, new Date().getTime() + 10000);

        console.log(user);

        if (!user) {
            throw new Error("User not authenticated");
        }

        this.user = new User(user);
        googleAnalytics.setUserId(this.user.id);

        // Set users initial language
        if(!this.user.settings.languageKey) {
            try {
                this.user.settings.languageKey = navigator.language.split("-")[0];
                this.user.saveSettings();
            }
            catch {
                this.user.settings.languageKey = "en";
                this.user.saveSettings();
            }
        }

        this._initialized = false;
        this.collections = await collectionService.list();

        const lastCacheClear = await cache.get("config", "last_cache_clear") as Date | undefined;

        if (!lastCacheClear || lastCacheClear.getTime() < (new Date().getTime() - 86400000)) {
            await cache.clearCache();

            await cache.set("config", "last_cache_clear", new Date());
        }

        const lastTimeUpdated = await cache.get("config", "last_updated") as Date | undefined;

        const shouldUpdate = !lastTimeUpdated || lastTimeUpdated.getTime() < (new Date().getTime() - 3600000);

        if (shouldUpdate) {
            await cache.set("config", "last_updated", new Date());
        }

        const ownedCols = this.collections.filter(c => c.type == "song").map(c => c.id);

        const previousCols = await cache.get("config", "owned_collections") as string[] | undefined;

        if (previousCols) {
            const fetchSongs = ownedCols.filter(c => !previousCols.includes(c));

            if (fetchSongs.length) {
                const s = await songs.getAllSongs([]);

                await cache.replaceEntries("songs", s.result.reduce((a, b) => {
                    a[b.id] = b;
                    return a;
                }, {} as {
                    [id: string]: ISong;
                }));

                // const f = await songs.getFiles(fetchSongs);

                // await cache.replaceEntries("files", f.result.reduce((a, b) => {
                //     a[b.id] = b;
                //     return a;
                // }, {} as {
                //     [id: string]: IMediaFile;
                // }));

                const c = await songs.getContributors();

                await cache.replaceEntries("contributors", c.result.reduce((a, b) => {
                    a[b.id] = b;
                    return a;
                }, {} as {
                    [id: string]: ICollectionItem<ApiContributor>;
                }));
            }
        }

        const fetchContributors = async () => {
            try {
                const key = "last_updated_contributors";
                const lastUpdated = await cache.get("config", key) as Date | undefined;
                if (shouldUpdate) {
                    const updateItems = await songs.getContributors(lastUpdated?.toISOString());

                    await cache.replaceEntries("contributors", updateItems.result.reduce((a, b) => {
                        a[b.id] = b;
                        return a;
                    }, {} as {
                        [id: string]: ICollectionItem<ApiContributor>;
                    }));

                    await cache.set("config", key, new Date(updateItems.lastUpdated));
                }
            }
            catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const error = e as any;
                notify("error", "Error occured", "warning", error);
                this.contributors = (await songs.getContributors()).result.map(s => new CollectionItem<ApiContributor>(s));
            }

            this.contributors = (this.contributors.length > 0 ? this.contributors : (await cache.getAll("contributors")).map(s => new CollectionItem<ApiContributor>(s))).sort((a, b) => a.item.name > b.item.name ? 1 : -1);
        };

        const fetchAll = [fetchContributors()];

        for (const f of this._preFetch) {
            fetchAll.push(f());
        }

        await Promise.all(fetchAll);

        await this.getViews();

        try {
            const key = "lyrics_expiry";
            const expiry = await cache.get("config", key) as Date | undefined;

            if (!expiry || expiry.getTime() < new Date().getTime()) {
                await cache.clearStore("lyrics");

                const date = new Date();
                date.setDate(date.getDate() + 1);
                await cache.set("config", key, date);
            } else {
                this.lyrics = (await cache.getAll("lyrics")).map(i => new Lyrics(i));
            }
        }
        catch {
            // ignore the errors
        }

        this._initialized = true;
    }

    private views?: {
        [key: string]: number;
    };

    public get Views() {
        return this.views ?? {};
    }

    private lastUpdated?: Date;

    public async getViews() {
        if (this.views) {
            const date = new Date();
            date.setSeconds(date.getSeconds() - 10);

            if (this.lastUpdated && this.lastUpdated < date) {
                analytics.getTotalViews().then(r => {
                    this.views = r;
                });
            }

            return this.views;
        }
        try {
            this.views = await analytics.getTotalViews();
        }
        catch {
            this.views = {};
        }
    }

    private keys?: ShareKey[];

    public get Keys() {
        return this.keys ?? [];
    }

    public addKey(key: ShareKey) {
        this.keys = [...this.keys ?? [], key];
    }

    public async getKeys() {
        if (this.keys) return this.Keys;

        try {
            this.keys = await sharing.getKeys();
        }
        catch {
            this.keys = [];
        }
        return this.Keys;
    }

    public get Language() {
        return this._user?.settings.languageKey ?? "en";
    }

    public async clear() {
        await auth.logout();
    }

    public getCollection(key: string) {
        return this.collections.find(c => c.id === key || Object.values(c.keys).includes(key)) ?? null;
    }

    public collection(key: string) {
        const collection = this.getCollection(key);
        if (!collection) {
            throw new Error("Collection not found");
        }
        return collection;
    }

    private _onReady: (() => void)[] = [];
    public onReady(f: () => void) {
        this._onReady.push(f);
    }
    public ready(authenticated = false) {
        for (const f of this._onReady) {
            f();
        }
        this._onReady = [];
        this.Ready = true;
        this.Authenticated = authenticated;
    }
    public Ready = false;
    public Authenticated = false;
}

export const appSession = new Session();
