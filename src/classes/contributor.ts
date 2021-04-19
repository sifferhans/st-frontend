import { ApiContributor } from "dmb-api";
import { Converter } from "showdown";
const converter = new Converter();

export class Contributor implements ApiContributor {
    public biography: {
        [key: string]: string;
    } = {};
    public birthYear = 0;
    public country = "";
    public id = "";
    public name = "";
    public subtitle = "";
    public image? = "";

    constructor(contributor: ApiContributor) {
        this.biography = contributor.biography;
        this.birthYear = contributor.birthYear;
        this.country = contributor.country;
        this.id = contributor.id;
        this.name = contributor.name;
        this.subtitle = contributor.subtitle;
        this.image = contributor.image;
    }

    public getBiography(language: string) {
        const content = this.biography[language] ?? this.biography.no ?? undefined;

        if (content) {
            return converter.makeHtml(content);
        } else {
            return undefined;
        }
    }
}
