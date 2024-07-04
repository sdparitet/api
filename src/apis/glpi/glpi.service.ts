import {Injectable, HttpStatus} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Express, Response} from "express";

import {GLPI_DB_CONNECTION} from '~root/src/constants';
import {
    GetTicketFollowupsResponse,
    GetTicketInfoResponse,
    GetTicketUsersResponse, RequestBaseDto, RequestDownloadDocumentDto, RequestFileUploadDto,
    RequestTicketIdAndUsernameDto,
    RequestTicketIdDto,
    RequestUserAccessOnTicket,
    RequestUsernameDto,
    SetTicketFollowupsDto,
    SetTicketFollowupsResponse,
    TicketsMembersResponse,
    UserTicketsResponse,
} from '~glpi/dto/post-request-dto';
import {GetGlpiUsersInGroupsResponse} from "~glpi/dto/get-request-dto";
import {GLPI} from "~root/src/connectors/glpi/glpi.connector";

@Injectable()
export class GLPI_Service {
    constructor(
        @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource
    ) {
    }

    /**region [ Ticket list ] */
    async GetUserTickets(dto: RequestUsernameDto, res: Response) {
        try {
            // Check permission = ?
            const ret: UserTicketsResponse[] = await this.glpi.query('' +
                'SELECT t.id ' +
                '     , t.type ' +
                '     , t.name ' +
                '     , t.status ' +
                '     , i.completename as category ' +
                '     , t.date_creation ' +
                '     , t.time_to_resolve ' +
                'FROM glpi_tickets t ' +
                '    LEFT JOIN glpi_itilcategories i ON t.itilcategories_id = i.id ' +
                'WHERE t.is_deleted = 0 ' +
                '  AND t.id in ( ' +
                '    SELECT tu.tickets_id ' +
                '    FROM glpi_tickets_users tu ' +
                '    WHERE tu.type = 1 ' +
                `      AND tu.users_id in (SELECT id FROM glpi_users u WHERE u.name = '${dto.name || ''}') ` +
                '  ) ' +
                ';')
            if (ret) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    async GetTicketsMembers(dto: RequestUsernameDto, res: Response) {
        try {
            const ret: TicketsMembersResponse[] = await this.glpi.query('' +
                'select *                                                                                             ' +
                'from (select t.id                                                   as ticket_id                     ' +
                '     , u.id                                                                                          ' +
                '     , CONCAT(u.realname, \' \', u.firstname)                       as name                          ' +
                '     , 1                                                            as memberType                    ' +
                '     , tu.type                                                      as accessoryType                 ' +
                'from glpi_tickets t                                                                                  ' +
                '         inner join glpi_tickets_users tu on t.id = tu.tickets_id                                    ' +
                '         left join glpi_users u on tu.users_id = u.id                                                ' +
                'union                                                                                                ' +
                'select t.id                                                        as ticket_id                      ' +
                '     , g.id                                                                                          ' +
                '     , g.name                                                                                        ' +
                '     , 2                                                           as memberType                     ' +
                '     , tg.type                                                     as accessoryType                  ' +
                'from glpi_tickets t                                                                                  ' +
                '         inner join glpi_groups_tickets tg on t.id = tg.tickets_id                                   ' +
                '         left join glpi_groups g on tg.groups_id = g.id) as data                                     ' +
                'where data.ticket_id in (select tu2.tickets_id                                                       ' +
                '               from glpi_tickets_users tu2                                                           ' +
                '               where tu2.type = 1                                                                    ' +
                `                 and tu2.users_id in (select u2.id from glpi_users u2 where u2.name = '${dto.name}')); `)
            if (ret) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    // endregion

    /**region [ Ticket info ] */
    async GetUserAccessOnTicket(dto: RequestTicketIdAndUsernameDto, res: Response) {
        try {
            const ret: RequestUserAccessOnTicket[] = await this.glpi.query('' +
                'select if(count(id) > 0, 1, 0) as access,                                                  ' +
                `(select if(count(id) > 0, 1, 0) from glpi_tickets where id = ${dto.id}) as found           ` +
                'from glpi_tickets_users                                                                    ' +
                `where tickets_id = ${dto.id}                                                               ` +
                '  and type = 1                                                                             ' +
                `  and users_id = (select id from glpi_users where name = \'${dto.name}\');                 `)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret[0])
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    async GetTicketInfo(dto: RequestTicketIdAndUsernameDto, res: Response) {
        try {
            const ret: GetTicketInfoResponse[] = await this.glpi.query('' +
                'select t.id,                                                      ' +
                '       t.name,                                                    ' +
                '       t.status,                                                  ' +
                '       t.type,                                                    ' +
                '       c.completename as category,                                ' +
                '       t.date_creation,                                           ' +
                '       t.time_to_resolve,                                         ' +
                '       t.solvedate as date_solve,                                 ' +
                '       t.closedate as date_close                                  ' +
                'from glpi_tickets t                                               ' +
                '    left join glpi_itilcategories c on t.itilcategories_id = c.id ' +
                `where t.id = ${dto.id || '0'} ;`)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }


    async GetTicketMembers(dto: RequestTicketIdDto, res: Response) {
        try {
            const ret: GetTicketUsersResponse[] = await this.glpi.query('' +
                'select tu.tickets_id as \'ticket_id\',                      ' +
                '       u.id,                                                ' +
                '       CONCAT(u.firstname, \' \', u.realname) as name,      ' +
                '       1 as \'memberType\',                                 ' +
                '       type as \'accessoryType\'                            ' +
                'from glpi_tickets_users tu                                  ' +
                '         left join glpi_users u                             ' +
                '                   on tu.users_id = u.id                    ' +
                `where tickets_id = ${dto.id || '0'}                         ` +
                'union                                                       ' +
                'select tg.tickets_id as \'ticket_id\',                      ' +
                '       g.id,                                                ' +
                '       g.name,                                              ' +
                '       2 as \'memberType\',                                 ' +
                '       tg.type as \'accessoryType\'                         ' +
                'from glpi_groups_tickets tg                                 ' +
                '         left join glpi_groups g                            ' +
                '                   on tg.groups_id = g.id                   ' +
                `where tickets_id = ${dto.id || '0'};                        `)
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    async GetTicketChat(dto: RequestTicketIdAndUsernameDto, res: Response) {
        try {
            const ret: GetTicketFollowupsResponse[] = await this.glpi.query('' +
                'select \'Followup\'                           as type,                                             ' +
                '       f.id,                                                                                       ' +
                '       f.items_id                             as ticketId,                                         ' +
                `       if(u.name = \'${dto.name}\', 1, 2)     as authorType,                                       ` +
                '       CONCAT(u.firstname, \' \', u.realname) as name,                                             ' +
                '       f.content,                                                                                  ' +
                '       \'\'                                   as data,                                             ' +
                '       f.date_creation                        as date                                              ' +
                'from glpi_itilfollowups f                                                                          ' +
                '         left join glpi_users u on f.users_id = u.id                                               ' +
                'where itemtype = \'Ticket\'                                                                        ' +
                `  and items_id = ${dto.id}                                                                         ` +
                '  and is_private = 0                                                                               ' +
                'union                                                                                              ' +
                'select \'File\'                               as type,                                             ' +
                '       d.id,                                                                                       ' +
                '       di.items_id                            as ticketId,                                         ' +
                `       if(u.name = \'${dto.name}\', 1, 2)     as authorType,                                       ` +
                '       CONCAT(u.firstname, \' \', u.realname) as name,                                             ' +
                '       d.filename                             as content,                                          ' +
                '       d.mime                                 as data,                                             ' +
                '       di.date_creation                       as date                                              ' +
                'from glpi_documents_items di                                                                       ' +
                '         left join glpi_users u on di.users_id = u.id                                              ' +
                '         left join glpi_documents d on di.documents_id = d.id                                      ' +
                'where itemtype = \'Ticket\'                                                                        ' +
                `  and items_id = ${dto.id}                                                                         ` +
                'union                                                                                              ' +
                'select \'Solution\'                           as type,                                             ' +
                '       s.id,                                                                                       ' +
                '       s.items_id                             as ticketId,                                         ' +
                '       2                                      as authorType,                                       ' +
                '       CONCAT(u.firstname, \' \', u.realname) as name,                                             ' +
                '       s.content,                                                                                  ' +
                '       s.status                               as data,                                             ' +
                '       s.date_creation                        as date                                              ' +
                'from glpi_itilsolutions s                                                                          ' +
                '         left join glpi_users u on s.users_id = u.id                                               ' +
                'where s.itemtype = \'Ticket\'                                                                      ' +
                `  and items_id = ${dto.id}                                                                         ` +
                'union                                                                                              ' +
                'select \'Description\'                                   as type,                                  ' +
                '       t.id,                                                                                       ' +
                '       t.id                                              as ticketId,                              ' +
                '       1                                                 as authorType,                            ' +
                '       (select CONCAT(u.firstname, \' \', u.realname)                                              ' +
                '        from glpi_users u                                                                          ' +
                '        where id = ((select users_id                                                               ' +
                '           from glpi_tickets_users tu                                                              ' +
                '           where tu.tickets_id = 5866 and tu.type = 1))) as name,                                  ' +
                '       t.content,                                                                                  ' +
                '       \'\'                                              as data,                                  ' +
                '       t.date_creation                                   as date                                   ' +
                'from glpi_tickets t                                                                                ' +
                `where id = ${dto.id}                                                                               ` +
                'order by date;                                                                                     ')
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    async SetTicketFollowup(dto: SetTicketFollowupsDto, res: Response) {
        try {
            const ret: SetTicketFollowupsResponse[] = await this.glpi.query('' +
                'insert into glpi_itilfollowups (itemtype, items_id, date, users_id, users_id_editor, content, date_mod, date_creation) ' +
                'values ( \'Ticket\'                                                        ' +
                `       , ${dto.ticket_id}                                                  ` +
                '       , NOW()                                                             ' +
                `       , (select id from glpi_users where name = '${dto.username}')        ` +
                '       , 0                                                                 ' +
                `       , \'${dto.content}\'                                                ` +
                '       , NOW()                                                             ' +
                '       , NOW());                                                           ')
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    // endregion

    /** region [ Phonebook ] */
    async GetGlpiUsersInGroups(res: Response) {
        try {
            const ret: GetGlpiUsersInGroupsResponse[] = await this.glpi.query('' +
                'select                                                 ' +
                '     u.groups_id as group_id,                          ' +
                '     g.name as group_name,                             ' +
                '     u.id,                                             ' +
                '     CONCAT(u.firstname, \' \', u.realname) as name,   ' +
                '     um.email,                                         ' +
                '     u.phone                                           ' +
                'from glpi_users u                                      ' +
                '     left join glpi_useremails um                      ' +
                '         on u.id = um.users_id                         ' +
                '     left join glpi_groups g                           ' +
                '         on u.groups_id = g.id                         ' +
                'where um.is_default = 1 and u.groups_id <> 0           ' +
                'order by g.name, name;                                 ')
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    // endregion

    /**region [GLPI API] */
    async GlpiApiWrapper(name: string, dataSource: DataSource, res: Response, func: (glpi: GLPI) => void) {
        const glpi = await new GLPI(name, dataSource)
        try {
            func(glpi)
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
        } finally {
            await glpi.kill_session()
        }
    }

    async CreateTicketFollowup(dto: RequestBaseDto, res: Response) {
        await this.GlpiApiWrapper(dto.username, this.glpi, res, async (glpi) => {
            // await glpi.create_followup()

            res.status(HttpStatus.OK).json([])
        })
    }

    async UploadTicketDocument(file: Express.Multer.File, dto: RequestFileUploadDto, res: Response) {
        await this.GlpiApiWrapper(dto.username, this.glpi, res, async (glpi) => {
            const ret = await glpi.upload_ticket_document(file, dto.ticket_id)

            res.status(ret.status).json(ret.data)
        })
    }

    async DownloadDocument(dto: RequestDownloadDocumentDto, res: Response) {
        await this.GlpiApiWrapper(dto.name, this.glpi, res, async (glpi) => {
            const ret = await glpi.download_document(dto.id)

            res.set('Content-Disposition', `attachment; filename=${ret.filename}`)
            res.set('Content-Type', 'application/octet-stream');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
            res.set('Content-Length', ret.data.length.toString())

            res.status(ret.status).send(ret.data)
        })
    }

    //endregion

}
