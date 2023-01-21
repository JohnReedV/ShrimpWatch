export class Utils {

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}