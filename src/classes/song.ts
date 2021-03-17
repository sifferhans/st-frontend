import { Converter } from 'showdown';
import { ApiSong, MediaFile } from "dmb-api";
import { Collection } from './collection';
import { Contributor } from './contributor';
const converter = new Converter();
converter.setOption('simpleLineBreaks', true);

export class Song implements ApiSong {
    public id: string;
    public number = 0;
    public type: string;
    public name: LocaleString;
    public collection?: Collection;
    public copyright: {
        melody?: Copyright;
        text?: Copyright;
    };
    public transpositions: {
        [key: string]: number;
    };
    public originalKey: string;
    public verses: number;

    public getName(language: string) {
        return this.name[language] ?? this.name.en ?? this.name[Object.keys(this.name)?.filter(n => !n.startsWith("_"))[0]];
    }

    public authors: Contributor[] = []
    public composers: Contributor[] = [];
    public leadSheetUrl = "";
    public yearWritten = 0;
    public themes: Theme[] = [];
    public originCountry: Country = {} as Country;
    public audioFiles: MediaFile[] = [];
    public videoFiles: MediaFile[] = [];
    public sheetMusic: MediaFile[] = [];
    public details: {
        [languageKey: string]: string;
    } = {};
    public melodyOrigin = {} as Origin;
    public hasLyrics: boolean;

    constructor(song: ApiSong) {
        this.id = song.id;
        this.number = song.number;
        this.name = song.name;
        this.authors = song.authors.map(a => new Contributor(a));
        this.composers = song.composers.map(c => new Contributor(c));
        this.collection = song.collection ? new Collection(song.collection) : undefined;
        this.leadSheetUrl = song.leadSheetUrl;
        this.yearWritten = song.yearWritten;
        this.originCountry = song.originCountry;
        this.audioFiles = song.audioFiles;
        this.videoFiles = song.videoFiles;
        this.sheetMusic = song.sheetMusic;
        this.details = song.details;
        this.melodyOrigin = song.melodyOrigin;
        this.type = song.type;
        this.themes = song.themes;
        this.hasLyrics = song.hasLyrics;
        this.originalKey = song.originalKey;
        this.transpositions = song.transpositions;
        this.copyright = song.copyright;
        this.verses = song.verses;
    }

    public language(code: string): boolean {
        if (Object.keys(this.name).includes(code)) return true;

        return false;
    }

    public get description() {

        const contents: {
            [key: string]: string;
        } = {};

        for (const key of Object.keys(this.details)) {
            contents[key] = converter.makeHtml(this.details[key]);
        }

        return contents;
    }

    public get rawContributorNames() {
        const names: string[] = [];

        this.authors.forEach(a => {
            names.push(a.name.toLowerCase());
        });

        this.composers.forEach(c => {
            names.push(c.name.toLowerCase());
        });

        return names.join('').replace(/[^0-9a-zA-Z]/g, '');
    }
}
