import { ViewColumn, ViewEntity } from 'typeorm';
import { STAT_DB_CONNECTION } from '~root/src/constants';


/**
 * @param {number} id
 * @param {number} status
 * @param {number} time_reaction
 * @param {number} time_solution
 * @param {number} user_cost
 * @param {number} ticket_cost
 * @param {number} stat_updated
 * @param {string} name
 * @param {string} content
 * @param {number} user_updater_id
 * @param {string} user_updater
 * @param {number} entity_id
 * @param {string} entity
 * @param {number} user_recipient_id
 * @param {string} user_recipient
 * @param {number} user_author_id
 * @param {string} user_author
 * @param {number} user_specialist_id
 * @param {string} user_specialist
 * @param {number} user_viewer_id
 * @param {string} user_viewer
 * @param {number} group_author_id
 * @param {string} group_author
 * @param {number} group_specialist_id
 * @param {string} group_specialist
 * @param {number} group_viewer_id
 * @param {string} group_viewer
 * @param {string} request_type
 * @param {number} urgency
 * @param {number} impact
 * @param {number} priority
 * @param {string} category
 * @param {string} type
 * @param {boolean} isDeleted
 * @param {string} date_creation
 * @param {string} date_open
 * @param {string} date_solve
 * @param {string} date_close
 * @param {string} date_mode
 * @param {string} request_type
 */
@ViewEntity({
   name: 'all_tickets',
   database: STAT_DB_CONNECTION,
   synchronize: false,
   expression: 'drop view all_tickets;' +
      'select t.id                                     as id ' +
      '     , st.ticket_status                         as status ' +
      '     , st.reaction                              as time_reaction ' +
      '     , st.solution                              as time_solution ' +
      '     , ud.fotfield                              as user_cost ' +
      '     , TRUNCATE(st.solution * ud.fotfield, 2)   as ticket_cost ' +
      '     , st.last_update                           as stat_updated ' +
      '     , t.name ' +
      '     , t.content ' +
      '     , t.users_id_lastupdater                   as user_updater_id ' +
      '     , CONCAT(ul.firstname, \' \', ul.realname) as user_updater ' +
      '     , t.entities_id                            as entity_id ' +
      '     , te.name                                  as entity ' +
      '     , t.users_id_recipient                     as user_recipient_id ' +
      '     , CONCAT(ur.firstname, \' \', ur.realname) as user_recipient ' +
      '     , tu1.users_id                             as user_author_id ' +
      '     , CONCAT(ur1.firstname, \' \', ur1.realname) as user_author ' +
      '     , tu2.users_id                             as user_specialist_id ' +
      '     , CONCAT(ur2.firstname, \' \', ur2.realname) as user_specialist ' +
      '     , tu3.users_id                             as user_viewer_id ' +
      '     , CONCAT(ur3.firstname, \' \', ur3.realname) as user_viewer ' +
      '     , tg1.groups_id                            as group_author_id ' +
      '     , ug1.completename                         as group_author ' +
      '     , tg2.groups_id                            as group_specialist_id ' +
      '     , ug2.completename                         as group_specialist ' +
      '     , tg3.groups_id                            as group_viewer_id ' +
      '     , ug3.completename                         as group_viewer ' +
      '     , rt.name                                  as request_type ' +
      '     , t.urgency                                as urgency ' +
      '     , t.impact                                 as impact ' +
      '     , t.priority                               as priority ' +
      '     , CONCAT( ' +
      '        IF(tc5.id, CONCAT(tc5.name, \' > \'), \'\'), ' +
      '        IF(tc4.id, CONCAT(tc4.name, \' > \'), \'\'), ' +
      '        IF(tc3.id, CONCAT(tc3.name, \' > \'), \'\'), ' +
      '        IF(tc2.id, CONCAT(tc2.name, \' > \'), \'\'), ' +
      '        IF(tc1.id, CONCAT(tc1.name, \' > \'), \'\'), ' +
      '        tc0.name ' +
      '       )                                        as category ' +
      '     , t.type                                   as type ' +
      '     , t.is_deleted                             as isDeleted ' +
      '     , t.date_creation                          as date_creation ' +
      '     , t.date                                   as date_open ' +
      '     , t.solvedate                              as date_solve ' +
      '     , t.closedate                              as date_close ' +
      '     , t.date_mod                               as date_mode ' +
      'from stat.ticket st ' +
      '         left join glpi.glpi_tickets t on t.id = st.ticket_id ' +
      '         left join glpi.glpi_tickets_users tu1 on tu1.tickets_id = t.id and tu1.type = 1 ' +
      '         left join glpi.glpi_tickets_users tu2 on tu2.tickets_id = t.id and tu2.type = 2 ' +
      '         left join glpi.glpi_tickets_users tu3 on tu3.tickets_id = t.id and tu3.type = 3 ' +
      '         left join glpi.glpi_groups_tickets tg1 on tg1.tickets_id = t.id and tg1.type = 1 ' +
      '         left join glpi.glpi_groups_tickets tg2 on tg2.tickets_id = t.id and tg2.type = 2 ' +
      '         left join glpi.glpi_groups_tickets tg3 on tg3.tickets_id = t.id and tg3.type = 3 ' +
      '         left join glpi.glpi_users ul on ul.id = t.users_id_lastupdater ' +
      '         left join glpi.glpi_users ur on ur.id = t.users_id_recipient ' +
      '         left join glpi.glpi_users ur1 on ur1.id = tu1.users_id ' +
      '         left join glpi.glpi_users ur2 on ur2.id = tu2.users_id ' +
      '         left join glpi.glpi_users ur3 on ur3.id = tu3.users_id ' +
      '         left join glpi.glpi_groups ug1 on ug1.id = tg1.groups_id ' +
      '         left join glpi.glpi_groups ug2 on ug2.id = tg2.groups_id ' +
      '         left join glpi.glpi_groups ug3 on ug3.id = tg3.groups_id ' +
      '         left join glpi.glpi_entities te on te.id = t.entities_id ' +
      '         left join glpi.glpi_requesttypes rt on rt.id = t.requesttypes_id ' +
      '         left join glpi.glpi_plugin_fields_userdifferents ud on ud.itemtype = \'User\' and ud.items_id = tu2.users_id ' +
      '         left join glpi.glpi_itilcategories tc0 on tc0.id = t.itilcategories_id ' +
      '         left join glpi.glpi_itilcategories tc1 on tc1.id = tc0.itilcategories_id ' +
      '         left join glpi.glpi_itilcategories tc2 on tc2.id = tc1.itilcategories_id ' +
      '         left join glpi.glpi_itilcategories tc3 on tc3.id = tc2.itilcategories_id ' +
      '         left join glpi.glpi_itilcategories tc4 on tc4.id = tc3.itilcategories_id ' +
      '         left join glpi.glpi_itilcategories tc5 on tc5.id = tc4.itilcategories_id ' +
      'where t.id is not null' +
      ';'
})
export class Stat_ALLTicket {

   @ViewColumn()
   id: number;

   @ViewColumn()
   status: number;

   @ViewColumn()
   time_reaction: number;

   @ViewColumn()
   time_solution: number;

   @ViewColumn()
   user_cost: number;

   @ViewColumn()
   ticket_cost: number;

   @ViewColumn()
   stat_updated: number;

   @ViewColumn()
   name: string;

   @ViewColumn()
   content: string;

   @ViewColumn()
   user_updater_id: number;

   @ViewColumn()
   user_updater: string;

   @ViewColumn()
   entity_id: number;

   @ViewColumn()
   entity: string;

   @ViewColumn()
   user_recipient_id: number;

   @ViewColumn()
   user_recipient: string;


   @ViewColumn()
   user_author_id: number;

   @ViewColumn()
   user_author: string;

   @ViewColumn()
   user_specialist_id: number;

   @ViewColumn()
   user_specialist: string;

   @ViewColumn()
   user_viewer_id: number;

   @ViewColumn()
   user_viewer: string;

   @ViewColumn()
   group_author_id: number;

   @ViewColumn()
   group_author: string;

   @ViewColumn()
   group_specialist_id: number;

   @ViewColumn()
   group_specialist: string;

   @ViewColumn()
   group_viewer_id: number;

   @ViewColumn()
   group_viewer: string;

   @ViewColumn()
   request_type: string;

   @ViewColumn()
   urgency: number;

   @ViewColumn()
   impact: number;

   @ViewColumn()
   priority: number;

   @ViewColumn()
   category: string;

   @ViewColumn()
   type: number;

   @ViewColumn()
   isDeleted: boolean;

   @ViewColumn()
   date_creation: string;

   @ViewColumn()
   date_open: string;

   @ViewColumn()
   date_solve: string;

   @ViewColumn()
   date_close: string;

   @ViewColumn()
   date_mode: string;
}
