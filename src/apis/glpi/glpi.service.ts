import {Injectable, HttpStatus} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Response} from "express";

import {GLPI_DB_CONNECTION} from '~root/src/constants';
import {
    GetTicketFollowupsResponse,
    GetTicketInfoResponse,
    GetTicketUsersResponse,
    RequestTicketIdAndUsernameDto,
    RequestTicketIdDto,
    RequestUserAccessOnTicket,
    RequestUsernameDto,
    SetTicketFollowupsDto,
    SetTicketFollowupsResponse,
    TicketsMembersResponse,
    UserTicketsResponse,
} from '~glpi/dto/post-request-dto';

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
                '       t.closedate as date_close,                                 ' +
                '       t.content                                                  ' +
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

    async GetTicketFollowups(dto: RequestTicketIdAndUsernameDto, res: Response) {
        try {
            const ret: GetTicketFollowupsResponse[] = await this.glpi.query('' +
                'select f.id,                                              ' +
                '       items_id,                                          ' +
                `        if(u.name = \'${dto.name}\', 1, 2) as authorType, ` +
                '       CONCAT(u.firstname, \' \', u.realname) as name,    ' +
                '       content as message,                                ' +
                '       f.date_creation as date                            ' +
                'from glpi_itilfollowups f                                 ' +
                '         left join glpi_users u                           ' +
                '                   on f.users_id = u.id                   ' +
                'where itemtype = \'Ticket\'                               ' +
                `  and items_id = ${dto.id}                                ` +
                '  and is_private = 0                                      ' +
                'order by f.date_creation;                                 ')
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

}
