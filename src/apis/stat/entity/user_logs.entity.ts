import { ViewColumn, ViewEntity } from 'typeorm';
import { STAT_DB_CONNECTION } from '~root/src/constants';


/**
 * @param {number} id
 * @param {number} fot
 * @param {string} name
 * @param {string} full_name
 * @param {number} ticket_id
 * @param {number} l_type
 * @param {string} l_date
 * @param {string} old_value
 * @param {string} new_value
 */
@ViewEntity({
   name: 'user_logs',
   database: STAT_DB_CONNECTION,
   synchronize: false,
   expression: 'drop view user_logs;' +
      'select ul.id ' +
      '     , ul.fotfield as fot ' +
      '     , ul.name ' +
      '     , ul.full_name ' +
      '     , ul.ticket_id ' +
      '     , ul.l_type ' +
      '     , ul.l_date ' +
      '     , ul.old_value ' +
      '     , ul.new_value ' +
      'from (select u.* ' +
      '           , lt.items_id as ticket_id ' +
      '           , l.date_mod as l_date ' +
      '           , if(l.linked_action = 15 and l.id_search_option = 5, 2 ' +
      '           , if(l.linked_action = 16 and l.id_search_option = 0, 3 ' +
      '           , if(l.linked_action = 0 AND l.id_search_option = 12, 6 ' +
      '           , if(l.linked_action = 0 and l.id_search_option = 17, 7 ' +
      '           , if(l.linked_action = 0 and l.id_search_option = 16, 8 ' +
      '           , 0))))) as l_type ' +
      '           , l.old_value ' +
      '           , l.new_value ' +
      '      from (select ud.fotfield ' +
      '                 , u.id ' +
      '                 , u.name ' +
      '                 , concat_ws(\' \', u.realname, u.firstname) as full_name ' +
      '            from glpi.glpi_users u ' +
      '                     inner join glpi.glpi_plugin_fields_userdifferents ud ' +
      '                                on ud.itemtype = \'User\' and ud.items_id = u.id ' +
      '            ) u ' +
      '# 2 - назначение ' +
      '# 3 - снятие спеца ' +
      '# 6 - статус (1 - новая, 2 в работе, 3 - запланирована, 4 - ожидание, 5 - решена, 6 - закрыта) ' +
      '# 7 - дата решения ' +
      '# 8 - дата закрытия ' +
      ' ' +
      '          inner join glpi.glpi_logs lt on ' +
      '              lt.itemtype = \'Ticket\' ' +
      '                  and ( ' +
      '                      (lt.linked_action = 15 AND lt.id_search_option = 5 and lt.new_value like concat(\'%(\', u.id, \')\')) #2 ' +
      '                   or (lt.linked_action = 16 and lt.id_search_option = 0 and lt.old_value like concat(\'%(\', u.id, \')\')) #3 ' +
      '                 ) ' +
      '#                   and items_id = 319 ' +
      ' ' +
      '          inner join glpi.glpi_logs l on ' +
      '              l.itemtype = \'Ticket\' and lt.items_id = l.items_id ' +
      '                  and ( ' +
      '                      (l.linked_action = 15 AND l.id_search_option = 5 and l.new_value like concat(\'%(\', u.id, \')\')) #2 ' +
      '                   or (l.linked_action = 16 and l.id_search_option = 0 and l.old_value like concat(\'%(\', u.id, \')\')) #3 ' +
      '                   or (l.linked_action = 0 AND l.id_search_option = 12) #6 ' +
      '                   or (l.linked_action = 0 AND l.id_search_option = 17) #7 ' +
      '                   or (l.linked_action = 0 AND l.id_search_option = 16) #8 ' +
      '                 ) ' +
      '      ) ul ' +
      'group by ul.id, ticket_id, l_date, l_type ' +
      'order by ul.id, ul.ticket_id, ul.l_date ' +
      ';'
})
export class Stat_UserLogs {

   @ViewColumn()
   id: number;

   @ViewColumn()
   fot: number;

   @ViewColumn()
   name: string;

   @ViewColumn()
   full_name: string;

   @ViewColumn()
   ticket_id: number;

   @ViewColumn()
   l_type: number;

   @ViewColumn()
   l_date: string;

   @ViewColumn()
   old_value: string;

   @ViewColumn()
   new_value: string;
}
