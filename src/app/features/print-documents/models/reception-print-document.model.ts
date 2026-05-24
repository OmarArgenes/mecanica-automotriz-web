export interface ReceptionPrintDocument {
  receptionCode: string;
  orderCode: string;

  customer: {
    fullName: string;
    phone: string;
    document: string;
    address: string;
  };

  vehicle: {
    plate: string;
    brand: string;
    model: string;
    year: string;
    color: string;
    mileage: string;
    fuelType: string;
  };

  intake: {
    date: string;
    time: string;
    arrivalMethod: string;
    arrivalState: string;
    driverName: string;
    mechanicName: string;
    reportedProblems: string;
  };

  inspection: {
    vehicleCondition: {
      dented: boolean;
      scratched: boolean;
      broken: boolean;
      noDamage: boolean;
      other: string;
    };
    tireCondition: {
      frontRight: string;
      frontLeft: string;
      rearRight: string;
      rearLeft: string;
    };
    fuelLevel: string;
    vehicleInventory: {
      spareTire: boolean;
      wheelWrench: boolean;
      jack: boolean;
      fireExtinguisher: boolean;
      hubcaps: boolean;
      mirrors: boolean;
      antenna: boolean;
      radio: boolean;
      tools: boolean;
      floorMats: boolean;
      fogLights: boolean;
      other: boolean;
    };
    inventoryObservations: string;
  };
}
