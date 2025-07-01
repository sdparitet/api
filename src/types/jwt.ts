export interface JwtData {
   userId: number
   userGuid: string
   userName: string
   picture: string
   userRoles: string[]
   iat: number
   exp: number
   aud: string
   iss: string
}

