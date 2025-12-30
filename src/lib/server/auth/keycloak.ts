import { KeyCloak } from 'arctic';
import {
	KEYCLOAK_URL,
	KEYCLOAK_REALM,
	KEYCLOAK_CLIENT_ID,
	KEYCLOAK_CLIENT_SECRET,
	ORIGIN
} from '$env/static/private';

const realmUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

export const keycloak = new KeyCloak(
	realmUrl,
	KEYCLOAK_CLIENT_ID,
	KEYCLOAK_CLIENT_SECRET,
	`${ORIGIN}/auth/callback`
);

export interface KeycloakUserInfo {
	sub: string;
	email: string;
	email_verified: boolean;
	name?: string;
	preferred_username?: string;
	given_name?: string;
	family_name?: string;
}

export async function getKeycloakUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
	const response = await fetch(`${realmUrl}/protocol/openid-connect/userinfo`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch user info from Keycloak');
	}

	return response.json();
}

export function getKeycloakLogoutUrl(postLogoutRedirectUri?: string): string {
	const logoutUrl = new URL(`${realmUrl}/protocol/openid-connect/logout`);
	if (postLogoutRedirectUri) {
		logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
		logoutUrl.searchParams.set('client_id', KEYCLOAK_CLIENT_ID);
	}
	return logoutUrl.toString();
}
