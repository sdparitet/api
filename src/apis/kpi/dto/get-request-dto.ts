
/**
 * @param {number} group_id
 */
export class KPI_GetRequestDto {
   constructor(model: KPI_GetRequestDto) {
      this.group_id = model.group_id
   }

   readonly group_id: number;
}
