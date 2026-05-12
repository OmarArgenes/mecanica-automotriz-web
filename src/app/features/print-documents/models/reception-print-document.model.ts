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
    reportedProblems: string;
    initialObservation: string;
  };
}
