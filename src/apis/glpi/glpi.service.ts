import {Injectable, HttpStatus} from "@nestjs/common";
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Response} from "express";

import {GLPI_DB_CONNECTION} from '~root/src/constants';
import {
    IGetTicketInfoResponse, IRequestTicketIdDto,
    IRequestUsernameDto, ITicketsMembersResponse, IUserTicketsResponse,
} from '~glpi/dto/post-request-dto';

@Injectable()
export class GLPI_Service {
    constructor(
        @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource
    ) {
    }

    /**region [ Ticket list ] */
    async GetUserTickets(dto: IRequestUsernameDto, res: Response) {
        try {
            // Check permission = ?
            const ret: IUserTicketsResponse[] = await this.glpi.query('' +
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
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    async GetTicketsMembers(dto: IRequestUsernameDto, res: Response) {
        try {
            const ret: ITicketsMembersResponse[] = await this.glpi.query('' +
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
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    // endregion

    //ToDo CHECK & CHANGE
    /**region [ Ticket info ] */
    async GetTicketInfoByID(dto: IRequestTicketIdDto, res: Response) {
        try {
            const ret: IGetTicketInfoResponse[] = await this.glpi.query('' +
                'select t.id,                                                      ' +
                '       t.name,                                                    ' +
                '       t.status,                                                  ' +
                '       t.type,                                                    ' +
                '       c.completename,                                            ' +
                '       t.date_creation,                                           ' +
                '       t.time_to_resolve,                                         ' +
                '       t.solvedate,                                               ' +
                '       t.closedate,                                               ' +
                '       t.content                                                  ' +
                'from glpi_tickets t                                               ' +
                '    left join glpi_itilcategories c on t.itilcategories_id = c.id ' +
                `where t.id = ${dto.id || '0'}` +
                ';')
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }


    async GetTicketUsersByTicketID(dto: IRequestTicketIdDto, res: Response) {
        try {
            const ret: IGetTicketInfoResponse[] = await this.glpi.query('' +
                'select u.id,                                                ' +
                '       CONCAT(u.firstname, \' \', u.realname) as name,      ' +
                '       type,                                                ' +
                '       1                                    as \'itemType\' ' +
                'from glpi_tickets_users tu                                  ' +
                '         left join glpi_users u                             ' +
                '                   on tu.users_id = u.id                    ' +
                `where tickets_id = ${dto.id || '0'}                         ` +
                'union                                                       ' +
                'select g.id,                                                ' +
                '       g.name,                                              ' +
                '       tg.type,                                             ' +
                '       2 as \'itemType\'                                    ' +
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

    async GetTicketFollowupsByTicketID(dto: IRequestTicketIdDto, res: Response) {
        try {
            const ret: IGetTicketInfoResponse[] = await this.glpi.query('' +
                'select f.id,                                           ' +
                '       items_id,                                       ' +
                '       CONCAT(u.firstname, \' \', u.realname) as name, ' +
                '       content,                                        ' +
                '       f.date_creation                                 ' +
                'from glpi_itilfollowups f                              ' +
                '         left join glpi_users u                        ' +
                '                   on f.users_id = u.id                ' +
                'where itemtype = \'Ticket\'                            ' +
                `  and items_id = ${dto.id}                             ` +
                '  and is_private = 0                                   ' +
                'order by f.date_creation;                              ')
            if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([]);
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
        }
    }

    // endregion

}
