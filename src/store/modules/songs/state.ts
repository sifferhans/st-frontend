import { Collection, CollectionItem, Song } from "@/classes";
import SearchResult from "@/classes/search/searchResult";
import { ApiContributor, MediaFile } from "dmb-api";


export type AudioTrack = {
    file: MediaFile;
    collection?: Collection;
}

export type State = {
    collectionId?: string;
    language: string;
    transcode: string;
    song?: Song;
    songId?: string;
    transposition?: number;
    newMelody: boolean;
    verses: Verse[];
    lines: string[];
    collections: Collection[];
    initialized: boolean;
    list: string;
    contributorItem?: CollectionItem<ApiContributor>;
    filter: SongFilter;
    audio?: AudioTrack;
    view: "transpose" | "default" | "loading";
    sheetMusic?: SheetMusicOptions;
    search?: string;
    searchResult?: SearchResult;
}

export const state: State = {
    collections: [],
    verses: [],
    lines: [],
    initialized: false,
    list: "default",
    newMelody: false,
    filter: {
        themes: [],
        videoFiles: [],
        audioFiles: [],
        origins: [],
        contentTypes: [],
        sheetMusicTypes: [],
        hasAudioFiles: false,
        hasLyrics: false,
        hasSheetMusic: false,
        hasVideoFiles: false,
    },
    language: "en",
    view: "default",
    transcode: "common",
};
