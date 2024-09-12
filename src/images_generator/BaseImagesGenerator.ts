import fontFamilyBoldUrl from './fonts/RobotoMonoBold.ttf';
import fontFamilyRegularUrl from './fonts/RobotoMonoRegular.ttf';

export interface IImagesGeneratorOptions {
    storyImage?: boolean;
    messageImage?: boolean;
}

export interface IImagesGeneratorResponse {
    storyImage?: string;
    messageImage?: string;
}

// TODO need fix this strange dynamic import
export enum AdditionalImageUrl {
    MESSAGE_BACKGROUND = './items/message_background.png',
    STORY_BACKGROUND = './items/story_background.png',
    STORY_LOGO = './items/story_logo.png',
    MESSAGE_LOGO = './items/message_logo.png',

    // Messages Stat
    MESSAGE_STAT_NUMBER_4 = './items/messages_stat/number4.png',
    MESSAGE_STAT_NUMBER_5 = './items/messages_stat/number5.png',
    MESSAGE_STAT_NUMBER_6 = './items/messages_stat/number6.png',
    MESSAGE_STAT_NUMBER_7 = './items/messages_stat/number7.png',
    MESSAGE_STAT_NUMBER_8 = './items/messages_stat/number8.png',
    MESSAGE_STAT_USER_CIRCLE = './items/messages_stat/user_circle.png',
    MESSAGE_STAT_TOP_3_CIRCLE = './items/messages_stat/top3_circle.png',
    MESSAGE_STAT_TOP_3_BACKGROUND = './items/messages_stat/top3_background.png',

    // Reg Date
    REG_DATE_STORY_CONFITI = './items/reg_date/story_confiti.png',
    REG_DATE_STORY_CIRCLE = './items/reg_date/story_circle.png',
    REG_DATE_MESSAGE_CONFITI = './items/reg_date/message_confiti.png',
    REG_DATE_MESSAGE_CIRCLE = './items/reg_date/message_circle.png',

    // Call Stat
    CALL_STAT_STARS = './items/call_stat/stars.png',
    CALL_STAT_BORDER = './items/call_stat/border.png'
}

function getAdditionalImage(image: AdditionalImageUrl) {
    if (image === AdditionalImageUrl.MESSAGE_BACKGROUND) {
        return import(AdditionalImageUrl.MESSAGE_BACKGROUND);
    }

    if (image === AdditionalImageUrl.STORY_BACKGROUND) {
        return import(AdditionalImageUrl.STORY_BACKGROUND);
    }

    if (image === AdditionalImageUrl.STORY_LOGO) {
        return import(AdditionalImageUrl.STORY_LOGO);
    }

    if (image === AdditionalImageUrl.MESSAGE_LOGO) {
        return import(AdditionalImageUrl.MESSAGE_LOGO);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_NUMBER_4) {
        return import(AdditionalImageUrl.MESSAGE_STAT_NUMBER_4);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_NUMBER_5) {
        return import(AdditionalImageUrl.MESSAGE_STAT_NUMBER_5);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_NUMBER_6) {
        return import(AdditionalImageUrl.MESSAGE_STAT_NUMBER_6);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_NUMBER_7) {
        return import(AdditionalImageUrl.MESSAGE_STAT_NUMBER_7);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_NUMBER_8) {
        return import(AdditionalImageUrl.MESSAGE_STAT_NUMBER_8);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_USER_CIRCLE) {
        return import(AdditionalImageUrl.MESSAGE_STAT_USER_CIRCLE);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_TOP_3_CIRCLE) {
        return import(AdditionalImageUrl.MESSAGE_STAT_TOP_3_CIRCLE);
    }

    if (image === AdditionalImageUrl.MESSAGE_STAT_TOP_3_BACKGROUND) {
        return import(AdditionalImageUrl.MESSAGE_STAT_TOP_3_BACKGROUND);
    }

    if (image === AdditionalImageUrl.REG_DATE_STORY_CONFITI) {
        return import(AdditionalImageUrl.REG_DATE_STORY_CONFITI);
    }

    if (image === AdditionalImageUrl.REG_DATE_STORY_CIRCLE) {
        return import(AdditionalImageUrl.REG_DATE_STORY_CIRCLE);
    }

    if (image === AdditionalImageUrl.REG_DATE_MESSAGE_CONFITI) {
        return import(AdditionalImageUrl.REG_DATE_MESSAGE_CONFITI);
    }

    if (image === AdditionalImageUrl.REG_DATE_MESSAGE_CIRCLE) {
        return import(AdditionalImageUrl.REG_DATE_MESSAGE_CIRCLE);
    }

    if (image === AdditionalImageUrl.CALL_STAT_STARS) {
        return import(AdditionalImageUrl.CALL_STAT_STARS);
    }

    if (image === AdditionalImageUrl.CALL_STAT_BORDER) {
        return import(AdditionalImageUrl.CALL_STAT_BORDER);
    }

    // kill me
    return import(AdditionalImageUrl.MESSAGE_BACKGROUND);
}

export class BaseImagesGenerator {
    app42Text = 't.me/app42';
    fontFamilyBold = 'Roboto Mono Bold';
    fontFamilyRegular = 'Roboto Mono Regular';
    mainColor = '#FFFFFF';
    secondColor = '#ABABAB';

    storyCanvas: HTMLCanvasElement = null as unknown as HTMLCanvasElement;
    storyContext: CanvasRenderingContext2D = null as unknown as CanvasRenderingContext2D;
    messageCanvas: HTMLCanvasElement = null as unknown as HTMLCanvasElement;
    messageContext: CanvasRenderingContext2D = null as unknown as CanvasRenderingContext2D;
    storyCanvasCenter = 0;
    messageCanvasCenter = 0;

    async prepareProcess(options: IImagesGeneratorOptions) {
        await this.initFonts();

        if (options.storyImage) {
            this.createStoryCanvas();
            this.storyContext.drawImage(await this.getImage(AdditionalImageUrl.STORY_BACKGROUND), 0, 0);
            await this.drawStoryAppFooter();
        }

        if (options.messageImage) {
            this.createMessageCanvas();
            this.messageContext.drawImage(await this.getImage(AdditionalImageUrl.MESSAGE_BACKGROUND), 0, 0);
            await this.drawMessageAppFooter();
        }
    }

    getResult() {
        const result: IImagesGeneratorResponse = {};

        if (this.storyCanvas) {
            result.storyImage = this.storyCanvas.toDataURL();
        }

        if (this.messageCanvas) {
            result.messageImage = this.messageCanvas.toDataURL();
        }

        return result;
    }

    async initFonts() {
        await this.loadFont(this.fontFamilyBold, fontFamilyBoldUrl);
        await this.loadFont(this.fontFamilyRegular, fontFamilyRegularUrl);
    }

    async drawStoryAppFooter() {
        const textCenter = this.storyCanvasCenter + 60;

        this.storyContext.globalAlpha = 0.5;
        this.storyContext.font = `40px ${this.fontFamilyBold}`;
        this.storyContext.fillStyle = this.mainColor;
        this.storyContext.fillText(this.app42Text, textCenter, 1800);

        const width = this.storyContext.measureText(this.app42Text).width;
        const logoXPosition = textCenter - width / 2 - 80;

        this.storyContext.drawImage(await this.getImage(AdditionalImageUrl.STORY_LOGO), logoXPosition, 1752);
        this.storyContext.globalAlpha = 1.0;
    }

    async drawMessageAppFooter() {
        this.messageContext.globalAlpha = 0.5;
        this.messageContext.font = `28px ${this.fontFamilyBold}`;
        this.messageContext.fillStyle = this.mainColor;
        this.messageContext.fillText(this.app42Text, 140, 964);

        this.messageContext.drawImage(await this.getImage(AdditionalImageUrl.MESSAGE_LOGO), 80, 930);
        this.messageContext.globalAlpha = 1.0;
    }

    async drawMockImage(prefix: string) {
        if (this.storyCanvas) {
            this.storyContext.globalAlpha = 0.5;
            await this.drawMock(this.storyContext, `${prefix}_story`);
            this.storyContext.globalAlpha = 1.0;
        }

        if (this.messageCanvas) {
            this.messageContext.globalAlpha = 0.5;
            await this.drawMock(this.messageContext, `${prefix}_message`);
            this.messageContext.globalAlpha = 1.0;
        }
    }

    async loadFont(name: string, url: string) {
        const fontFamily = new FontFace(name, `url(${url})`);
        await fontFamily.load();
        document.fonts.add(fontFamily);
    }

    createStoryCanvas() {
        this.storyCanvas = document.createElement('canvas') as HTMLCanvasElement;
        this.storyContext = this.storyCanvas.getContext('2d') as CanvasRenderingContext2D;

        this.storyCanvas.width = 1080;
        this.storyCanvas.height = 1920;
        this.storyContext.textAlign = 'center';
        this.storyCanvasCenter = this.storyCanvas.width / 2;
    }

    createMessageCanvas() {
        this.messageCanvas = document.createElement('canvas') as HTMLCanvasElement;
        this.messageContext = this.messageCanvas.getContext('2d') as CanvasRenderingContext2D;

        this.messageCanvas.width = 1440;
        this.messageCanvas.height = 1024;
        this.messageContext.textAlign = 'left';
        this.messageCanvasCenter = this.messageCanvas.width / 2;
    }

    // eslint-disable-next-line no-undef
    getImage(path: AdditionalImageUrl): Promise<CanvasImageSource> {
        return new Promise((resolve) => {
            getAdditionalImage(path).then((content) => {
                const img = new Image();

                img.src = content.default;
                img.onload = () => {
                    resolve(img);
                };
            });
        });
    }

    async drawMock(context: CanvasRenderingContext2D, name: string): Promise<void> {
        // eslint-disable-next-line no-undef
        const image = await new Promise<CanvasImageSource>((resolve) => {
            import(`./mock_images/${name}.jpg`).then((content) => {
                const img = new Image();

                img.src = content.default;
                img.onload = () => {
                    resolve(img);
                };
            });
        });

        context.drawImage(image, 0, 0);
    }

    async drawAvatar(
        context: CanvasRenderingContext2D,
        avatar: string | null,
        size: number,
        left: number,
        top: number,
        channelTitle?: string
    ) {
        let processedAvatar = avatar;
        if (!processedAvatar) {
            const processedAvatarSize = 280;
            const canvas = document.createElement('canvas');
            canvas.width = processedAvatarSize;
            canvas.height = processedAvatarSize;
            const ctx = canvas.getContext('2d');
            if (!ctx || !channelTitle) {
                console.error('Could not draw avatar');
                return;
            }

            const rootStyle = getComputedStyle(document.getElementById('method_header') as HTMLElement);
            const letter = channelTitle[0].toUpperCase();
            ctx.fillStyle = rootStyle.getPropertyValue('background-color');
            ctx.fillRect(0, 0, processedAvatarSize, processedAvatarSize);
            ctx.font = `${processedAvatarSize / 2}px ${this.fontFamilyBold}`;
            ctx.fillStyle = this.mainColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, processedAvatarSize / 2, processedAvatarSize / 2);

            processedAvatar = canvas.toDataURL();
        }

        await new Promise((resolveAvatar) => {
            const avatarImage = new Image(size, size);
            avatarImage.onload = () => {
                context.beginPath();
                context.save();
                context.arc(2 * size + left, 2 * size + top, 2 * size, 0, Math.PI * 2, true);
                context.clip();
                context.drawImage(avatarImage, left, top, 4 * size + 2, 4 * size + 2);
                context.stroke();
                context.restore();

                resolveAvatar(true);
            };
            avatarImage.src = processedAvatar as string;
        });
    }
}
