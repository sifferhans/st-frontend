
declare module "dmb-api" {
    interface ApiCollection {
        id: string;
        defaultType: string;
        name: {
            [lang: string]: string;
        };
        key: string;
        image: string;
        available?: boolean;
    }

    interface ApiSong {
        id: string;
        number: number;
        type: string;
        collection?: ApiCollection;
        name: {
            [languageKey: string]: string;
        };
        authors: ApiContributor[];
        authorIds?: string[];
        composers: ApiContributor[];
        composerIds?: string[];
        participants: ApiParticipant[];
        melodyOrigin: Origin;
        leadSheetUrl: string;
        yearWritten: number;
        themes: Theme[];
        originCountry: Country;
        audioFiles: MediaFile[];
        videoFiles: MediaFile[];
        sheetMusic: MediaFile[];
        hasLyrics: boolean;
        copyright: {
            text?: Copyright;
            melody?: Copyright;
        };
        transpositions: {
            [key: string]: number;
        };
        originalKey: string;
        verses: number;
        details: {
            [languageKey: string]: string;
        };
    }

    interface ApiLyrics {
        number: number;
        title: string;
        collectionKey: string;
        language: Language;
        content: JsonContent | string;
        format: string;
        hasChords: boolean;
        originalKey: string;
        transposedToKey: string;
        transpositions: {
            [key: string]: number;
        };
    }

    interface ApiContributor {
        id: string;
        name: string;
        birthYear: number;
        subtitle: string;
        country: string;
        biography: {
            [languageKey: string]: string;
        };
    }
    
    interface ApiContributorCollectionItem {
        contributor: ApiContributor;
        songs: ApiSong[];
        songIds: string[];
    }

    interface ApiThemeCollectionItem {
        theme: Theme;
        songIds: string[];
        songs: ApiSong[];
    }
    
    interface ApiCountryCollectionItem {
        country: Country;
        songIds: string[];
        songs: ApiSong[];
    }
    
    interface ApiProduct {
        id: string;
        name: LocaleString;
        collections: ApiCollection[];
        prices: Price[];
        priority: number;
    }

    interface ApiParticipant {
        contributorId: string;
        contributor: ApiContributor;
        type: string;
    }

    interface MediaFile {
        id: string;
        type: string;
        category: string;
        number: number;
        language: Language;
        name: string;
        directUrl: string;
        contributors: ApiContributor[];
    }
}

interface Copyright {
    id: string;
    name: LocaleString;
}

interface Theme {
    id: string;
    name: LocaleString;
}

interface JsonContent {
    [key: string]: {
        name: string;
        content: string[];
    };
}

interface Verse {
    type: string;
    name: string;
    content: string[];
}

interface Price {
    id: string;
    value: string;
    name: string;
    type: string;
}
