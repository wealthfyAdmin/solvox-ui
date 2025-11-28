import { toast } from "react-hot-toast";

export async function handleApiError(
    res: Response,
    fallbackMessage: string
): Promise<never> {
    let message = fallbackMessage;

    try {
        const data = await res.json();
        message = data.error || data.message || fallbackMessage;
    } catch {
        const text = await res.text();
        if (text) message = text;
    }

    throw new Error(message);
}

export function showError(error: any, fallbackMessage: string) {
    const msg = error?.message || fallbackMessage;
    toast.error(msg);
}
