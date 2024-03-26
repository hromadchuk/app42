import {
    AdditionalImageUrl,
    BaseImagesGenerator,
    IImagesGeneratorOptions,
    IImagesGeneratorResponse
} from './BaseImagesGenerator.ts';
import { formatNumber } from '../lib/helpers.ts';

export interface ICallStatImagesOptions extends IImagesGeneratorOptions {
    totalDurationCount: string;
    totalDurationLabel: string;
    callsCount: number;
    callsLabel: string;
    participantsCount: number;
    participantsLabel: string;
    maxDurationCount: string;
    maxDurationLabel: string;
}

export class CallStatImagesGenerator extends BaseImagesGenerator {
    async generate(options: ICallStatImagesOptions): Promise<IImagesGeneratorResponse> {
        options.messageImage = false;

        await super.prepareProcess(options);

        if (options.storyImage) {
            await this.drawStoryImage(options);
        }

        return this.getResult();
    }

    async drawStoryImage(data: ICallStatImagesOptions) {
        const {
            title,
            totalDurationCount,
            totalDurationLabel,
            callsCount,
            callsLabel,
            participantsCount,
            participantsLabel,
            maxDurationCount,
            maxDurationLabel
        } = data;

        this.storyContext.font = `82px ${this.fontFamilyBold}`;
        this.storyContext.fillText(title, this.storyCanvasCenter, 260);

        const partSize = this.storyCanvas.width / 3;

        // counters
        this.storyContext.font = `82px ${this.fontFamilyBold}`;
        this.storyContext.fillText(totalDurationCount, this.storyCanvasCenter, 670);

        this.storyContext.font = `68px ${this.fontFamilyBold}`;
        this.storyContext.fillText(formatNumber(callsCount), partSize, 1048);
        this.storyContext.fillText(formatNumber(participantsCount), partSize * 2, 1048);

        this.storyContext.font = `58px ${this.fontFamilyBold}`;
        this.storyContext.fillText(maxDurationCount, this.storyCanvasCenter, 1350);

        // descriptions
        this.storyContext.globalAlpha = 0.5;

        this.storyContext.font = `28px ${this.fontFamilyBold}`;
        this.storyContext.fillText(totalDurationLabel, this.storyCanvasCenter, 720);
        this.storyContext.fillText(maxDurationLabel, this.storyCanvasCenter, 1400);

        this.storyContext.font = `24px ${this.fontFamilyBold}`;
        this.storyContext.fillText(callsLabel, partSize, 1092);
        this.storyContext.fillText(participantsLabel, partSize * 2, 1092);

        this.storyContext.globalAlpha = 1;

        this.storyContext.drawImage(await this.getImage(AdditionalImageUrl.CALL_STAT_BORDER), 126, 470);
        this.storyContext.drawImage(await this.getImage(AdditionalImageUrl.CALL_STAT_STARS), 252, 1246);
    }
}
