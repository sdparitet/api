
/**
 * @param {number} year
 * @param {groupId|undefined} categoryId
 * @param {positionId|undefined} categoryId
 * @param {number|undefined} categoryId
 */
export class OUP_GetRequestDto {
   constructor(model: OUP_GetRequestDto) {
      this.year = model.year
      this.groupId = model.groupId
      this.positionId = model.positionId
      this.categoryId = model.categoryId
   }

   readonly year: number;
   readonly groupId?: number;
   readonly positionId?: number;
   readonly categoryId?: number;
}
