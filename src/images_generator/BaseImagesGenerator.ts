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

export class BaseImagesGenerator {
    kit42Text = 't.me/kit42_app'.toUpperCase();
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
            this.storyContext.drawImage(await this.getImage('./items/story_background.png'), 0, 0);
            await this.drawStoryAppFooter();
        }

        if (options.messageImage) {
            this.createMessageCanvas();
            this.messageContext.drawImage(await this.getImage('./items/message_background.png'), 0, 0);
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
        this.storyContext.fillText(this.kit42Text, textCenter, 1800);

        const width = this.storyContext.measureText(this.kit42Text).width;
        const logoXPosition = textCenter - width / 2 - 80;

        this.storyContext.drawImage(await this.getImage('./items/story_logo.png'), logoXPosition, 1752);
        this.storyContext.globalAlpha = 1.0;
    }

    async drawMessageAppFooter() {
        this.messageContext.globalAlpha = 0.5;
        this.messageContext.font = `28px ${this.fontFamilyBold}`;
        this.messageContext.fillStyle = this.mainColor;
        this.messageContext.fillText(this.kit42Text, 140, 964);

        this.messageContext.drawImage(await this.getImage('./items/message_logo.png'), 80, 930);
        this.messageContext.globalAlpha = 1.0;
    }

    async drawMockImage(prefix: string) {
        if (this.storyCanvas) {
            this.storyContext.globalAlpha = 0.5;
            this.storyContext.drawImage(await this.getImage(`./mock_images/${prefix}_story.jpg`), 0, 0);
            this.storyContext.globalAlpha = 1.0;
        }

        if (this.messageCanvas) {
            this.messageContext.globalAlpha = 0.5;
            this.messageContext.drawImage(await this.getImage(`./mock_images/${prefix}_message.jpg`), 0, 0);
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
    getImage(path: string): Promise<CanvasImageSource> {
        return new Promise((resolve) => {
            import(path).then((content) => {
                const img = new Image();

                img.src = content.default;
                img.onload = () => {
                    resolve(img);
                };
            });
        });
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

            const rootStyle = getComputedStyle(document.documentElement);
            const letter = channelTitle[0].toUpperCase();
            ctx.fillStyle = rootStyle.getPropertyValue('--mantine-color-grape-light').trim();
            ctx.fillRect(0, 0, processedAvatarSize, processedAvatarSize);
            ctx.font = `${processedAvatarSize / 2}px ${this.fontFamilyBold}`;
            ctx.fillStyle = rootStyle.getPropertyValue('--mantine-color-grape-light-color').trim();
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
