export interface ClientDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  propertyOwner: boolean;
  additionalInfo?:string;

}

export interface Service {
  serviceType: string;
  numOfTrees: number;
  treeLocation: string;
  treeType: string;
  treeHeight: string;
  imageUrls: string[];
  utilityLines: boolean;
  stumpRemoval: boolean;
  fallenDown: boolean;
  propertyFenced: boolean;
  equipmentAccess: boolean;
  emergencyCutting: boolean;
}

export class CreateQuoteDto {
  clientDetails: ClientDetails;
  services: Service[];
  // amount
  // createdDate
}
