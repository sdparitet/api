import {Request} from 'express';
import {JwtService} from '@nestjs/jwt';
import {IUserData} from '../shared';

export const getTokenData = (req: Request): IUserData | null => {
    const authHeader = req.headers.authorization;
    const jwt = new JwtService()
    try {
        const token = authHeader.split(" ")[1];
        if (token) {
            return jwt.decode(token)
        }
    } catch (_) {/* */
    }
    return null
}

export const escapeHtml = (html: string) => {
    return html.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

export const unescapeHtml = (str: string) => {
    return str.replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "\'")
        .replace(/&amp;/g, "&")
}
