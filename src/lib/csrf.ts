import { Api } from "./Api";

export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

export async function seedCsrf(): Promise<void> {
    try {
        // Obtiene el token CSRF del servidor
        const response = await Api.get('/csrf/');
        const csrfToken = response.data.csrfToken;

        // Guarda el token en una cookie
        document.cookie = `csrftoken=${csrfToken}; path=/`;
    } catch (error) {
        console.error('Error al obtener el token CSRF:', error);
    }
}
