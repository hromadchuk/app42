import { Api } from 'telegram';
import { SharingGenerator } from './SharingGenerator.ts';

interface IMessagesStatTopOptions {
    title: string;
    users: {
        info: Api.User;
        name: string;
        description: string;
    }[];
    description: string;
    subDescription: string;
}

export class MessagesStatSharingGenerator extends SharingGenerator {
    async getMessageImage(options: IMessagesStatTopOptions) {
        await this.init();

        const canvas = document.createElement('canvas') as HTMLCanvasElement;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;

        canvas.width = 2168;
        canvas.height = 1724;
        context.textAlign = 'center';

        context.drawImage(await this.getImage('bg_box'), 0, 0);

        const center = canvas.width / 2;

        this.drawAppName(context);

        // title
        context.font = `500 128px ${this.fontFamilyBold}`;
        context.fillStyle = this.titleColor;
        context.fillText(options.title, center, 300);

        const topDiff = options.users.length > 3 ? 0 : 200;
        const oneNameTop = 822;

        // top 1
        const user1 = options.users[0];
        await this.drawAvatar(context, user1.info, 78, center - 154, topDiff + 446);
        context.drawImage(await this.getImage('top_1'), center - 166, topDiff + 430);

        context.font = `600 54px ${this.fontFamilyBold}`;
        context.fillStyle = this.whiteColor;
        context.fillText('1', center - 114, topDiff + 502);

        context.font = `400 40px ${this.fontFamily}`;
        context.fillStyle = this.blackColor;
        context.fillText(user1.name, center, topDiff + oneNameTop);

        context.font = `500 32px ${this.fontFamily}`;
        context.fillStyle = this.descriptionColor;
        context.fillText(user1.description, center, topDiff + oneNameTop + 48);

        // top 2
        const user2 = options.users[1];
        await this.drawAvatar(context, user2.info, 58, center - 530, topDiff + 520);
        context.drawImage(await this.getImage('top_2'), center - 536, topDiff + 510);

        context.font = `600 40px ${this.fontFamilyBold}`;
        context.fillStyle = this.whiteColor;
        context.fillText('2', center - 497, topDiff + 564);

        context.font = `400 40px ${this.fontFamily}`;
        context.fillStyle = this.blackColor;
        context.fillText(user2.name, center - 410, topDiff + oneNameTop);

        context.font = `500 32px ${this.fontFamily}`;
        context.fillStyle = this.descriptionColor;
        context.fillText(user2.description, center - 410, topDiff + oneNameTop + 48);

        // top 3
        const user3 = options.users[2];
        await this.drawAvatar(context, user3.info, 58, center + 290, topDiff + 520);
        context.drawImage(await this.getImage('top_3'), center + 286, topDiff + 510);

        context.font = `600 40px ${this.fontFamilyBold}`;
        context.fillStyle = this.whiteColor;
        context.fillText('3', center + 326, topDiff + 564);

        context.font = `400 40px ${this.fontFamily}`;
        context.fillStyle = this.blackColor;
        context.fillText(user3.name, center + 410, topDiff + oneNameTop);

        context.font = `500 32px ${this.fontFamily}`;
        context.fillStyle = this.descriptionColor;
        context.fillText(user3.description, center + 410, topDiff + oneNameTop + 48);

        // other users
        const otherUsers = options.users.slice(3, 9);
        const moreAvatarSize = 58;
        const moreNameTop = 1288;
        let moreCenter = center - (otherUsers.length - 1) * (78.6 * 2);

        for (let i = 0; i < otherUsers.length; i++) {
            const user = otherUsers[i];

            await this.drawAvatar(context, user.info, moreAvatarSize, moreCenter - moreAvatarSize * 2 + 6, 982);
            context.drawImage(await this.getImage('top_n'), moreCenter - moreAvatarSize * 2, 978);

            context.font = `600 40px ${this.fontFamilyBold}`;
            context.fillStyle = this.whiteColor;
            context.fillText((i + 4).toString(), moreCenter - 76, 1031);

            context.font = `400 40px ${this.fontFamily}`;
            context.fillStyle = this.blackColor;
            context.fillText(user.name, moreCenter, moreNameTop);

            context.font = `500 26px ${this.fontFamily}`;
            context.fillStyle = this.descriptionColor;
            context.fillText(user.description, moreCenter, moreNameTop + 48);

            moreCenter += 312;
        }

        // description
        context.textAlign = 'left';
        context.font = `500 32px ${this.fontFamily}`;
        context.fillStyle = this.descriptionColor;
        context.fillText(options.description, 180, 1510);
        context.fillText(options.subDescription, 180, 1550);

        return canvas.toDataURL('image/png');
    }
}
