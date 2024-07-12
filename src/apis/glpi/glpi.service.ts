import {Injectable, HttpStatus, Inject} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Response} from "express";

import {GLPI_DB_CONNECTION} from '~root/src/constants';
import {
    TicketChatResponse,
    TicketInfoResponse,
    TicketMembersResponse,
    RequestTicketIdAndUsernameDto,
    RequestTicketIdDto,
    UserAccessOnTicket,
    RequestUsernameDto,
    TicketFollowupDto,
    TicketFollowupsResponse,
    TicketsMembersResponse,
    UserTicketsResponse,
    GlpiUsersInGroupsResponse, UploadTicketDocumentResponse,
} from '~glpi/dto/post-request-dto';
import {GetImagePreviewParams} from "~glpi/dto/get-request-dto";
import {GLPI} from "~root/src/connectors/glpi/glpi-api.connector";
// import {CACHE_MANAGER} from "@nestjs/cache-manager";
// import {Cache} from "cache-manager";
import sharp, {Sharp} from "sharp";

@Injectable()
export class GLPI_Service {
    constructor(
        @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource,
        // @Inject(CACHE_MANAGER) private cacheService: Cache,
    ) {
    }

    /**region [ Wrappers ] */
    async RequestWrapper(res: Response, func: () => void) {
        try {
            func()
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
        }
    }

    async GlpiApiWrapper(username: string, dataSource: DataSource, res: Response, func: (glpi: GLPI) => void) {
        const glpi = await new GLPI(username, dataSource)
        if (glpi.authorized) {
            try {
                func(glpi)
            } catch (err: any) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
            } finally {
                // await glpi.kill_session()
            }
        } else {
            return res.status(HttpStatus.UNAUTHORIZED).json([])
        }
    }

    // endregion

    /**region [ Ticket list ] */
    async GetUserTickets(dto: RequestUsernameDto, res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: UserTicketsResponse[] = await this.glpi.query(`
                SELECT t.id
                     , t.type
                     , t.name
                     , t.status
                     , i.completename as category
                     , t.date_creation
                     , t.time_to_resolve
                FROM glpi_tickets t
                         LEFT JOIN glpi_itilcategories i ON t.itilcategories_id = i.id
                WHERE t.is_deleted = 0
                  AND t.id in (SELECT tu.tickets_id
                               FROM glpi_tickets_users tu
                               WHERE tu.type = 1
                                 AND tu.users_id in (SELECT id FROM glpi_users u WHERE u.name = '${dto.username || ''}'));`)
            if (ret) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        })
    }

    async GetTicketsMembers(dto: RequestUsernameDto, res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: TicketsMembersResponse[] = await this.glpi.query(`
                select *
                from (select t.id                                 as ticket_id
                           , u.id
                           , CONCAT(u.realname, ' ', u.firstname) as name
                           , 1                                    as memberType
                           , tu.type                              as accessoryType
                      from glpi_tickets t
                               inner join glpi_tickets_users tu on t.id = tu.tickets_id
                               left join glpi_users u on tu.users_id = u.id
                      union
                      select t.id    as ticket_id
                           , g.id
                           , g.name
                           , 2       as memberType
                           , tg.type as accessoryType
                      from glpi_tickets t
                               inner join glpi_groups_tickets tg on t.id = tg.tickets_id
                               left join glpi_groups g on tg.groups_id = g.id) as data
                where data.ticket_id in (select tu2.tickets_id
                                         from glpi_tickets_users tu2
                                         where tu2.type = 1
                                           and tu2.users_id in (select u2.id
                                                                from glpi_users u2
                                                                where u2.name = '${dto.username}'));`)
            if (ret) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        })
    }

    // endregion

    /**region [ Ticket info ] */
    async GetUserAccessOnTicket(dto: RequestTicketIdAndUsernameDto, res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: UserAccessOnTicket[] = await this.glpi.query(`
                select if(count(id) > 0, 1, 0) as access
                     , (select if(count(id) > 0, 1, 0) from glpi_tickets where id = ${dto.id}) as found
                from glpi_tickets_users
                where tickets_id = ${dto.id}
                  and type = 1
                  and users_id = (select id from glpi_users where name = '${dto.username}');`)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret[0])
            else res.status(HttpStatus.BAD_REQUEST).json([])
        })
    }

    async GetTicketInfo(dto: RequestTicketIdAndUsernameDto, res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: TicketInfoResponse[] = await this.glpi.query(`
                select t.id
                     , t.name
                     , t.status
                     , t.type
                     , c.completename as category
                     , t.date_creation
                     , t.time_to_resolve
                     , t.solvedate    as date_solve
                     , t.closedate    as date_close
                from glpi_tickets t
                         left join glpi_itilcategories c on t.itilcategories_id = c.id
                where t.id = ${dto.id};`)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret[0])
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        })
    }

    async GetTicketMembers(dto: RequestTicketIdDto, res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: TicketMembersResponse[] = await this.glpi.query(`
                select tu.tickets_id                        as ticket_id
                     , u.id
                     , CONCAT(u.realname, ' ', u.firstname) as name
                     , 1                                    as memberType
                     , type                                 as accessoryType
                     , u.phone
                from glpi_tickets_users tu
                         left join glpi_users u
                                   on tu.users_id = u.id
                where tickets_id = ${dto.id}
                union
                select tg.tickets_id as ticket_id
                     , g.id
                     , g.name
                     , 2             as memberType
                     , tg.type       as accessoryType
                     , null          as phone
                from glpi_groups_tickets tg
                         left join glpi_groups g
                                   on tg.groups_id = g.id
                where tickets_id = ${dto.id};`)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        })
    }

    async GetTicketChat(dto: RequestTicketIdAndUsernameDto, res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: TicketChatResponse[] = await this.glpi.query(`
                select u.id                                 as userId
                     , CONCAT(u.realname, ' ', u.firstname) as name
                     , if(u.name = '${dto.username}', 0, 1) as sideLeft
                     , f.id                                 as id
                     , 'Message'                            as type
                     , f.content                            as text
                     , f.date_creation as time
                from glpi_itilfollowups f
                    left join glpi_users u
                on f.users_id = u.id
                where itemtype = 'Ticket'
                  and items_id = ${dto.id}
                  and is_private = 0
                union
                select u.id                                                as userId
                     , CONCAT(u.realname, ' ', u.firstname)                as name
                     , if(u.name = '${dto.username}', 0, 1)                as sideLeft
                     , d.id                                                as id
                     , if(d.mime REGEXP '^image\\\\/.*$', 'Image', 'File') as type
                     , d.filename                                          as text
                     , di.date_creation as time
                from glpi_documents_items di
                    left join glpi_users u
                on di.users_id = u.id
                    left join glpi_documents d on di.documents_id = d.id
                where itemtype = 'Ticket'
                  and items_id = ${dto.id}
                union
                select u.id                                 as userId
                     , CONCAT(u.realname, ' ', u.firstname) as name
                     , if(u.name = '${dto.username}', 0, 1) as sideLeft
                     , s.id                                 as id
                     , 'Solution'                           as type
                     , s.content                            as text
                     , s.date_creation as time
                from glpi_itilsolutions s
                    left join glpi_users u
                on s.users_id = u.id
                where s.itemtype = 'Ticket'
                  and items_id = ${dto.id}
                union
                select (select u.id
                        from glpi_users u
                        where id = ((select users_id
                                     from glpi_tickets_users tu
                                     where tu.tickets_id = ${dto.id}
                                       and tu.type = 1))) as userId
                     , (select CONCAT(u.realname, ' ', u.firstname)
                        from glpi_users u
                        where id = ((select users_id
                                     from glpi_tickets_users tu
                                     where tu.tickets_id = ${dto.id}
                                       and tu.type = 1))) as name
                     , 0                                  as sideLeft
                     , t.id                               as id
                     , 'Message'                          as type
                     , t.content                          as text
                     , t.date_creation as time
                from glpi_tickets t
                where id = ${dto.id}
                order by time;`)

            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        })
    }

    async OldCreateTicketFollowup(dto: TicketFollowupDto, res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: TicketFollowupsResponse = await this.glpi.query(`
                insert into glpi_itilfollowups ( itemtype
                                               , items_id
                                               , date
                                               , users_id
                                               , users_id_editor
                                               , content
                                               , date_mod
                                               , date_creation)
                values ( 'Ticket'
                       , ${dto.ticket_id}
                       , NOW()
                       , (select id from glpi_users where name = '${dto.username}')
                       , 0
                       , '${dto.text}'
                       , NOW()
                       , NOW());`)

            if (ret) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        })
    }

    // endregion

    /** region [ Phonebook ] */
    async GetGlpiUsersInGroups(res: Response) {
        await this.RequestWrapper(res, async () => {
            const ret: GlpiUsersInGroupsResponse[] = await this.glpi.query(`
                select u.groups_id                          as group_id
                     , g.name                               as group_name
                     , u.id
                     , CONCAT(u.realname, ' ', u.firstname) as name
                     , um.email
                     , u.phone
                from glpi_users u
                         left join glpi_useremails um
                                   on u.id = um.users_id
                         left join glpi_groups g
                                   on u.groups_id = g.id
                where um.is_default = 1
                  and u.groups_id <> 0
                order by g.name, name;`)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        })
    }

    // endregion

    /**region [GLPI API] */
    async CreateTicketFollowup(dto: TicketFollowupDto, res: Response) {
        await this.GlpiApiWrapper(dto.username, this.glpi, res, async (glpi) => {
            const ret = await glpi.create_followup(dto.ticket_id, dto.text)

            res.status(ret.status).json({id:ret.data.id, message: ret.data.message, userId: glpi.userId, userFIO: glpi.userFIO })
        })
    }

    async UploadTicketDocument(file: Express.Multer.File, dto: RequestTicketIdAndUsernameDto, res: Response) {
        if (file) {
            await this.GlpiApiWrapper(dto.username, this.glpi, res, async (glpi) => {
                const ret: UploadTicketDocumentResponse = await glpi.upload_ticket_document(file, dto.id, dto.filename)

                res.status(ret.status).json(ret)
            })
        } else {
            res.status(HttpStatus.BAD_REQUEST).json({status: 'error', message: 'File not provided'})
        }
    }

    async DownloadDocument(dto: RequestTicketIdAndUsernameDto, res: Response) {
        let filename = 'unknown.file'

        const _ret = await this.glpi.query(`select filename
                                            from glpi_documents
                                            where id = '${dto.id}';`)
        if (_ret) {
            filename = _ret[0].filename
        }
        await this.GlpiApiWrapper(dto.username, this.glpi, res, async (glpi) => {
            const ret = await glpi.download_document(dto.id)

            res.set('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`)
            res.set('Content-Type', 'application/octet-stream');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
            res.set('Content-Length', ret.data.length.toString())

            res.status(ret.status).send(ret.data)
        })
    }

    async CompressImage(image: Sharp) {
        const maxWidth = 480
        const maxHeight = 400
        const maxRelation = 20

        const meta = await image.metadata()
        const isHorizontal = meta.width > meta.height

        if ((Math.max(meta.width, meta.height) / Math.min(meta.width, meta.height)) > maxRelation) {
            return null
        } else {
            if (isHorizontal) {
                if (meta.width > maxWidth) {
                    return image.resize(maxWidth, Math.round(meta.height * maxWidth / meta.width)).toBuffer()
                } else {
                    return image.toBuffer()
                }
            } else {
                if (meta.height > maxHeight) {
                    return image.resize(Math.round(meta.width * maxHeight / meta.height), maxHeight).toBuffer()
                } else {
                    return image.toBuffer()
                }
            }
        }
    }

    async GetImagePreview(params: GetImagePreviewParams, res: Response) {
        // const cachedData: string = await this.cacheService.get(params.id.toString())
        // const ttl = 60 * 60 * 24 * 14

        // if (!cachedData) {
            let filename = 'unknown.file'

            const _ret = await this.glpi.query(`select filename
                                                from glpi_documents
                                                where id = '${params.id}';`)
            if (_ret) {
                filename = _ret[0].filename
            }
            await this.GlpiApiWrapper(params.username, this.glpi, res, async (glpi) => {
                const ret = await glpi.download_document(params.id)
                if (ret.status === HttpStatus.OK) {
                    if (ret.mime.split('/').length > 0 && ret.mime.split('/')[0] === 'image') {
                        const sharp = require('sharp')
                        const image = await sharp(Buffer.from(ret.data, "base64"))
                        let compressedImageBuffer: Buffer | null = await this.CompressImage(image)

                        if (compressedImageBuffer !== null) {
                            const compressedImage = await sharp(compressedImageBuffer)
                            const compressedMeta = await compressedImage.metadata()
                            const bufferData = await compressedImage.toBuffer()
                            res.status(ret.status).json({
                                id: params.id,
                                asFile: false,
                                fileName: filename,
                                fileSize: ret.data.length,
                                fileWidth: compressedMeta.width,
                                fileHeight: compressedMeta.height,
                                base64: bufferData.toString('base64'),
                            })

                            // await this.cacheService.set(params.id.toString(), JSON.stringify({
                            //     id: params.id,
                            //     asFile: false,
                            //     fileName: filename,
                            //     fileSize: compressedMeta.size,
                            //     fileWidth: compressedMeta.width,
                            //     fileHeight: compressedMeta.height,
                            //     base64: bufferData.toString('base64'),
                            // }), ttl)
                        } else {
                            res.status(ret.status).json({
                                id: params.id,
                                asFile: true,
                                fileName: filename,
                                fileSize: ret.data.length,
                                fileWidth: 0,
                                fileHeight: 0,
                                base64: ret.data.toString('base64'),
                            })
                            // await this.cacheService.set(params.id.toString(), JSON.stringify({
                            //     id: params.id,
                            //     asFile: true,
                            //     fileName: filename,
                            //     fileSize: ret.data.length,
                            //     fileWidth: 0,
                            //     fileHeight: 0,
                            //     base64: ret.data.toString('base64'),
                            // }), ttl)
                        }
                    } else {
                        res.status(ret.status).json({
                            id: params.id,
                            asFile: true,
                            fileName: filename,
                            fileSize: ret.data.length,
                            fileWidth: 0,
                            fileHeight: 0,
                            base64: ret.data.toString('base64'),
                        })
                        // await this.cacheService.set(params.id.toString(), JSON.stringify({
                        //     id: params.id,
                        //     asFile: true,
                        //     fileName: filename,
                        //     fileSize: ret.data.length,
                        //     fileWidth: 0,
                        //     fileHeight: 0,
                        //     base64: ret.data.toString('base64'),
                        // }), ttl)
                    }
                } else {
                    res.status(ret.status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : ret.status ).json([])
                }
            })
        // } else {
        //     res.status(HttpStatus.OK).json(JSON.parse(cachedData))
        // }
    }

    //endregion
}
