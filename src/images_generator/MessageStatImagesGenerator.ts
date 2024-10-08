import {
    AdditionalImageUrl,
    BaseImagesGenerator,
    IImagesGeneratorOptions,
    IImagesGeneratorResponse
} from './BaseImagesGenerator.ts';

interface IMessagesStatImagesUserOption {
    name: string;
    avatar?: string;
    description: string;
}

export interface IMessagesStatImagesOptions extends IImagesGeneratorOptions {
    title: string;
    bottomText: string;
    description: string;
    users: IMessagesStatImagesUserOption[];
}

export class MessageStatImagesGenerator extends BaseImagesGenerator {
    async generate(options: IMessagesStatImagesOptions): Promise<IImagesGeneratorResponse> {
        options.storyImage = false;

        await super.prepareProcess(options);

        if (options.messageImage) {
            await this.drawMessageImage(options);
        }

        return this.getResult();
    }

    async drawMessageImage(data: IMessagesStatImagesOptions) {
        const { title, description, bottomText, users } = data;

        // title
        this.messageContext.font = `67px ${this.fontFamilyBold}`;
        this.messageContext.fillStyle = this.mainColor;
        this.messageContext.fillText(title, 80, 150);

        // description and bottom text
        this.messageContext.globalAlpha = 0.5;
        this.messageContext.font = `20px ${this.fontFamilyBold}`;
        this.messageContext.fillText(description, 80, 204);

        this.messageContext.textAlign = 'right';
        this.messageContext.font = `20px ${this.fontFamilyBold}`;
        this.messageContext.fillText(bottomText, this.messageCanvas.width - 80, 960);
        this.messageContext.globalAlpha = 1;

        const yTop3 = users.length === 3 ? 430 : 312;
        await this.drawTopUsers(367, yTop3, users);

        const otherUsers = users.slice(3, 8);
        const center = this.messageCanvasCenter;
        let moreCenter = center - (otherUsers.length - 1) * 106.5;
        let userNumber = 4;

        const imageAliases = new Map([
            [4, await this.getImage(AdditionalImageUrl.MESSAGE_STAT_NUMBER_4)],
            [5, await this.getImage(AdditionalImageUrl.MESSAGE_STAT_NUMBER_5)],
            [6, await this.getImage(AdditionalImageUrl.MESSAGE_STAT_NUMBER_6)],
            [7, await this.getImage(AdditionalImageUrl.MESSAGE_STAT_NUMBER_7)],
            [8, await this.getImage(AdditionalImageUrl.MESSAGE_STAT_NUMBER_8)]
        ]);

        for (const user of otherUsers) {
            await this.drawAvatar(
                this.messageContext,
                user.avatar || null,
                28,
                moreCenter - 28 * 2 + 6,
                657,
                user.name
            );

            // eslint-disable-next-line no-undef
            this.messageContext.drawImage(imageAliases.get(userNumber++) as CanvasImageSource, moreCenter - 64, 640);

            this.messageContext.drawImage(
                await this.getImage(AdditionalImageUrl.MESSAGE_STAT_USER_CIRCLE),
                moreCenter - 28 * 2 + 1,
                657 - 5
            );

            this.messageContext.font = `20px ${this.fontFamilyBold}`;
            this.messageContext.fillText(user.name, moreCenter, 800);

            this.messageContext.globalAlpha = 0.5;
            this.messageContext.font = `18px ${this.fontFamilyRegular}`;
            this.messageContext.fillText(user.description, moreCenter, 822);
            this.messageContext.globalAlpha = 1;

            moreCenter += 213;
        }
    }

    private async drawTopUsers(x: number, y: number, users: IMessagesStatImagesUserOption[]) {
        let xOffset = 0;
        this.messageContext.textAlign = 'center';

        for (const user of users.slice(0, 3)) {
            await this.drawAvatar(this.messageContext, user.avatar || null, 40, x + xOffset, y, user.name);

            this.messageContext.drawImage(
                await this.getImage(AdditionalImageUrl.MESSAGE_STAT_TOP_3_CIRCLE),
                x + xOffset - 5,
                y - 5
            );
            this.messageContext.font = `27px ${this.fontFamilyBold}`;
            this.messageContext.fillText(user.name, x + xOffset + 82, y + 220);

            this.messageContext.globalAlpha = 0.5;
            this.messageContext.font = `25px ${this.fontFamilyRegular}`;
            this.messageContext.fillText(user.description, x + xOffset + 82, y + 254);
            this.messageContext.globalAlpha = 1;

            xOffset += 272;
        }

        this.messageContext.drawImage(
            await this.getImage(AdditionalImageUrl.MESSAGE_STAT_TOP_3_BACKGROUND),
            x + 82,
            y - 66
        );
    }
}
