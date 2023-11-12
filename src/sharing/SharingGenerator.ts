import { Api } from 'telegram';
import { CallAPI, dataUrlToFile, getAvatar } from '../lib/helpers.tsx';
import { getHideUser } from '../lib/hide.tsx';
// @ts-ignore
import fontFamilyUrl from './fonts/SFProText-Regular.ttf';
// @ts-ignore
import fontFamilyBoldUrl from './fonts/SFProText-Bold.ttf';

export class SharingGenerator {
    fontFamily = 'SF Pro Text';
    fontFamilyBold = 'SF Pro Text Bold';
    titleColor = '#007FFF';
    descriptionColor = '#9a9a9a';
    blackColor = '#000000';
    whiteColor = '#FFFFFF';

    static async sendMessage(base64: string, owner: Api.User | Api.Chat | Api.Channel) {
        const file = dataUrlToFile(base64, 'image.png');

        const upload = await window.TelegramClient.uploadFile({
            file,
            workers: 3
        });

        CallAPI(
            new Api.messages.SendMedia({
                peer: owner.id,
                media: new Api.InputMediaUploadedPhoto({
                    file: upload
                }),
                message: 'by @kit42_app'
            })
        );
    }

    static async prepareImages(owners: (Api.User | Api.Channel | Api.Chat)[]) {
        const uniqOwners = new Map<number, Api.User | Api.Channel | Api.Chat>();

        for (const owner of owners) {
            if (!uniqOwners.has(owner.id.valueOf())) {
                uniqOwners.set(owner.id.valueOf(), owner);
            }
        }

        const tasks = Array.from(uniqOwners.values()).map((owner) => getAvatar(owner));

        await Promise.all(tasks);
    }

    async init() {
        await this.loadFont(this.fontFamily, fontFamilyUrl);
        await this.loadFont(this.fontFamilyBold, fontFamilyBoldUrl);
    }

    drawAppName(context: CanvasRenderingContext2D) {
        context.font = `500 42px ${this.fontFamilyBold}`;
        context.fillStyle = '#439AEA';
        context.fillText('Kit 42', 1940, 1600);
    }

    async loadFont(name: string, url: string) {
        if (document.fonts.check(`42px ${name}`)) {
            return;
        }

        const fontFamily = new FontFace(name, `url(${url})`);
        await fontFamily.load();
        document.fonts.add(fontFamily);
    }

    // eslint-disable-next-line no-undef
    getImage(image: string): Promise<CanvasImageSource> {
        return new Promise((resolve) => {
            import(`./images/${image}.png`).then((content) => {
                const img = new Image();

                img.src = content.default;
                img.onload = () => {
                    resolve(img);
                };
            });
        });
    }

    async drawAvatar(context: CanvasRenderingContext2D, user: Api.User, size: number, left: number, top: number) {
        let avatar = await getAvatar(user);

        if (!avatar) {
            const hideUser = await getHideUser(user.id.valueOf());

            avatar = hideUser.photo as string;
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
            avatarImage.src = avatar as string;
        });
    }
}
