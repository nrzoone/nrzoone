const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/1YYJUVms5YuyNYoKH5f6T-Sxyu_LoaXyOXTTC0RYwTGOFXeRSxKboY2iK/exec";

export const syncToSheet = async (data, retries = 3) => {
    const payload = {
        timestamp: new Date().toLocaleString(),
        ...data
    };

    const trySync = async (attempt) => {
        try {
            await fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });
            console.log(`Sync Success [Attempt ${attempt}]:`, data.type);
            return true;
        } catch (error) {
            console.error(`Sync Error [Attempt ${attempt}]:`, error);
            if (attempt < retries) {
                console.log(`Retrying in ${attempt * 2}s...`);
                await new Promise(r => setTimeout(r, attempt * 2000));
                return trySync(attempt + 1);
            }
            return false;
        }
    };

    return trySync(1);
};
