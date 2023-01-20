export class Utils {

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
     }
}