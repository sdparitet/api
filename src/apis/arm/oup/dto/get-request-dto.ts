
/**
 * @param {number} year
 * @param {number|undefined} groupId
 * @param {number|undefined} positionId
 * @param {number|undefined} categoryId
 * @param {number|undefined} locationId
 */
export class OUP_GetRequestDto {
   constructor(model: OUP_GetRequestDto) {
      this.year = model.year
      this.groupId = model.groupId
      this.positionId = model.positionId
      this.categoryId = model.categoryId
      this.locationId = model.locationId
   }

   readonly year: number;
   readonly groupId?: number;
   readonly positionId?: number;
   readonly categoryId?: number;
   readonly locationId?: number;
}
