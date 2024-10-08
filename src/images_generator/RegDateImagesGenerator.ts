import {
    AdditionalImageUrl,
    BaseImagesGenerator,
    IImagesGeneratorOptions,
    IImagesGeneratorResponse
} from './BaseImagesGenerator.ts';

export interface IRegDateImagesOptions extends IImagesGeneratorOptions {
    title: string;
    bottomText: string;
    description: string;
    subTitle?: string;
    bottomDateText: string;
    avatar: string | null;
}

export class RegDateImagesGenerator extends BaseImagesGenerator {
    async generate(options: IRegDateImagesOptions): Promise<IImagesGeneratorResponse> {
        await super.prepareProcess(options);

        if (options.storyImage) {
            await this.drawStoryImage(options);
        }

        if (options.messageImage) {
            await this.drawMessageImage(options);
        }

        return this.getResult();
    }

    async drawStoryImage(data: IRegDateImagesOptions) {
        const { title, subTitle, description, bottomText, bottomDateText } = data;

        this.storyContext.font = `136px ${this.fontFamilyBold}`;
        this.storyContext.fillText(title, this.storyCanvasCenter, 940);

        if (subTitle) {
            this.storyContext.globalAlpha = 0.7;
            this.storyContext.font = `60px ${this.fontFamilyBold}`;
            this.storyContext.fillText(subTitle, this.storyCanvasCenter, 1040);
        }

        this.storyContext.globalAlpha = 0.5;

        const descriptionYPosition = subTitle ? 1120 : 1034;
        this.storyContext.font = `40px ${this.fontFamilyBold}`;
        this.storyContext.fillText(description, this.storyCanvasCenter, descriptionYPosition);

        const bottomTextYPosition = 1390;
        this.storyContext.font = `28px ${this.fontFamilyBold}`;
        this.storyContext.fillText(bottomText, this.storyCanvasCenter, bottomTextYPosition);
        this.storyContext.fillText(bottomDateText, this.storyCanvasCenter, bottomTextYPosition + 40);

        this.storyContext.globalAlpha = 1;

        await this.drawAvatar(this.storyContext, data.avatar, 70, this.storyCanvasCenter - 140, 420, data.bottomText);

        this.storyContext.drawImage(await this.getImage(AdditionalImageUrl.REG_DATE_STORY_CONFITI), 126, 190);
        this.storyContext.drawImage(
            await this.getImage(AdditionalImageUrl.REG_DATE_STORY_CIRCLE),
            this.storyCanvasCenter - 145,
            415
        );
    }

    async drawMessageImage(data: IRegDateImagesOptions) {
        const { title, subTitle, description, bottomText, bottomDateText } = data;

        this.messageContext.textAlign = 'center';
        this.messageContext.font = `136px ${this.fontFamilyBold}`;
        this.messageContext.fillStyle = this.mainColor;
        this.messageContext.fillText(title, this.messageCanvasCenter, 680);

        if (subTitle) {
            this.messageContext.globalAlpha = 0.7;
            this.messageContext.font = `60px ${this.fontFamilyBold}`;
            this.messageContext.fillText(subTitle, this.messageCanvasCenter, 760);
        }

        this.messageContext.globalAlpha = 0.5;

        const descriptionYPosition = subTitle ? 810 : 780;
        this.messageContext.font = `40px ${this.fontFamilyBold}`;
        this.messageContext.fillText(description, this.messageCanvasCenter, descriptionYPosition);

        this.messageContext.textAlign = 'right';
        this.messageContext.font = `20px ${this.fontFamilyBold}`;
        this.messageContext.fillText(`${bottomText} ${bottomDateText}`, this.messageCanvas.width - 50, 960);

        this.messageContext.globalAlpha = 1;

        await this.drawAvatar(
            this.messageContext,
            data.avatar,
            70,
            this.messageCanvasCenter - 140,
            214,
            data.bottomText
        );

        this.messageContext.drawImage(await this.getImage(AdditionalImageUrl.REG_DATE_MESSAGE_CONFITI), 150, 120);
        this.messageContext.drawImage(
            await this.getImage(AdditionalImageUrl.REG_DATE_MESSAGE_CIRCLE),
            this.messageCanvasCenter - 146,
            210
        );
    }
}
