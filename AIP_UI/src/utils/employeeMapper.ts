import { Employee } from '@/types/employee'
import { EmployeeRegistrationRequest, EmployeeDetailResponse } from '@/services/employeeService'
import { run } from 'node:test'

/**
 * Maps frontend Employee interface to backend EmployeeRegistrationRequest
 * Converts camelCase to PascalCase and handles data transformations
 */
export const mapToBackendRequest = (employee: Partial<Employee>): EmployeeRegistrationRequest => {
  return {
    // Required fields
    EmployeeNumber: employee.employeeNumber || '',
    Title: employee.title || '',
    FirstName: employee.firstName || '',
    Surname: employee.surname || '',
    StartDate: employee.startDate ? new Date(employee.startDate) : null,
    Position: employee.position || '',
    EmployeeStatus: employee.employeeStatus || '',
    EmploymentType: employee.employmentType || '',
    
    // Optional fields
    AipAccessLevel: employee.aipAccessLevel,
    Region: employee.region,
    Email: employee.email,
    ContactNumber: employee.contactNumber,
    
    // Address Information
    HouseName: employee.houseName,
    NumberAndStreet: employee.numberAndStreet,
    Town: employee.town,
    County: employee.county,
    PostCode: employee.postCode,
    
    // SIA License Information
    SiaLicenceType: employee.siaLicenceType,
    SiaLicenceExpiry: employee.siaLicenceExpiry ? new Date(employee.siaLicenceExpiry) : null,
    
    // Personal Information
    Nationality: employee.nationality,
    RightToWorkCondition: employee.rightToWorkCondition,
    
    // Driving License Information
    DrivingLicenceType: employee.drivingLicenceType,
    DateDLChecked: employee.dateDLChecked ? new Date(employee.dateDLChecked) : null,
    DrivingLicenceCopyTaken: employee.drivingLicenceCopyTaken,
    SixMonthlyCheck: employee.sixMonthlyCheck,
    
    // Checks and References
    GraydonCheckAuthorised: employee.graydonCheckAuthorised,
    GraydonCheckDetails: employee.graydonCheckDetails,
    InitialOralReferencesComplete: employee.initialOralReferencesComplete,
    InitialOralReferencesDate: employee.initialOralReferencesDate ? new Date(employee.initialOralReferencesDate) : null,
    WrittenRefsComplete: employee.writtenRefsComplete,
    WrittenRefsCompleteDate: employee.writtenRefsCompleteDate ? new Date(employee.writtenRefsCompleteDate) : null,
    QuickStarterFormCompleted: employee.quickStarterFormCompleted,
    
    // Employment Documentation Status
    WorkingTimeDirective: employee.workingTimeDirective,
    WorkingTimeDirectiveComplete: employee.workingTimeDirectiveComplete,
    ContractOfEmploymentSigned: employee.contractOfEmploymentSigned,
    PhotoTaken: employee.photoTaken,
    // PhotoFile: employee.photoFile, // Excluded - too large for registration (max 500 chars)
    IdCardIssued: employee.idCardIssued,
    EquipmentIssued: employee.equipmentIssued,
    UniformIssued: employee.uniformIssued,
    NextOfKinDetailsComplete: employee.nextOfKinDetailsComplete,
    PeopleHoursPin: employee.peopleHoursPin,
    
    // Training and Induction
    FullRotasIssued: employee.fullRotasIssued ? new Date(employee.fullRotasIssued) : null,
    InductionAndTrainingBooked: employee.inductionAndTrainingBooked ? new Date(employee.inductionAndTrainingBooked) : null,
    Location: employee.location,
    Trainer: employee.trainer,
  }
}

/**
 * Maps backend EmployeeDetailResponse to frontend Employee interface
 * Converts PascalCase to camelCase and handles data transformations
 */
export const mapFromBackendResponse = (response: EmployeeDetailResponse): Employee => {
  return {
    // Primary Key
    id: response.id,
    
    // Required Fields
    employeeNumber: response.employeeNumber,
    title: response.title || '',
    firstName: response.firstName,
    surname: response.surname,
    startDate: response.startDate,
    position: response.position,
    employeeStatus: response.employeeStatus || '',
    employmentType: response.employmentType || '',
    
    // Optional Fields
    aipAccessLevel: response.aipAccessLevel,
    region: response.region,
    email: response.email,
    contactNumber: response.contactNumber,
    
    // Address Information
    houseName: response.houseName,
    numberAndStreet: response.numberAndStreet,
    town: response.town,
    county: response.county,
    postCode: response.postCode,
    
    // SIA License Information
    siaLicenceType: response.siaLicenceType,
    siaLicenceExpiry: response.siaLicenceExpiry,
    
    // Personal Information
    nationality: response.nationality,
    rightToWorkCondition: response.rightToWorkCondition,
    
    // Driving License Information
    drivingLicenceType: response.drivingLicenceType,
    dateDLChecked: response.dateDLChecked,
    drivingLicenceCopyTaken: response.drivingLicenceCopyTaken,
    sixMonthlyCheck: response.sixMonthlyCheck,
    
    // Checks and References
    graydonCheckAuthorised: response.graydonCheckAuthorised,
    graydonCheckDetails: response.graydonCheckDetails,
    initialOralReferencesComplete: response.initialOralReferencesComplete,
    initialOralReferencesDate: response.initialOralReferencesDate,
    writtenRefsComplete: response.writtenRefsComplete,
    writtenRefsCompleteDate: response.writtenRefsCompleteDate,
    quickStarterFormCompleted: response.quickStarterFormCompleted,
    
    // Employment Documentation Status
    workingTimeDirective: response.workingTimeDirective,
    workingTimeDirectiveComplete: response.workingTimeDirectiveComplete,
    contractOfEmploymentSigned: response.contractOfEmploymentSigned,
    photoTaken: response.photoTaken,
    photoFile: response.photoFile,
    idCardIssued: response.idCardIssued,
    equipmentIssued: response.equipmentIssued,
    uniformIssued: response.uniformIssued,
    nextOfKinDetailsComplete: response.nextOfKinDetailsComplete,
    peopleHoursPin: response.peopleHoursPin,
    
    // Training and Induction
    fullRotasIssued: response.fullRotasIssued,
    inductionAndTrainingBooked: response.inductionAndTrainingBooked,
    location: response.location,
    trainer: response.trainer,
    
    // Relationships
    userId: response.userId,
    
    // Audit Fields
    createdAt: response.createdAt,
    createdBy: response.createdBy || '',
    updatedAt: response.updatedAt,
    updatedBy: response.updatedBy || '',
    
    // Computed Properties
    fullName: response.fullName,
    isSiaLicenceExpired: response.isSiaLicenceExpired || false,
    isSiaLicenceExpiringSoon: response.isSiaLicenceExpiringSoon || false,
  }
}

/**
 * Maps an array of backend responses to frontend Employee interfaces
 */
export const mapFromBackendResponseArray = (responses: EmployeeDetailResponse[]): Employee[] => {
  return responses.map(mapFromBackendResponse)
}

/**
 * Maps backend EmployeeListResponseDto to frontend Employee interface
 * This is specifically for list responses which have limited fields
 */
export const mapFromListResponse = (response: any): Employee => {
  return {
    // Primary Key  
    id: response.employeeId || response.id,
    
    // Basic Info from FullName
    employeeNumber: response.employeeNumber,
    title: '',
    firstName: response.fullName ? response.fullName.split(' ')[0] : '',
    surname: response.fullName ? response.fullName.split(' ').slice(1).join(' ') : '',
    startDate: response.startDate ? new Date(response.startDate) : new Date(),
    position: response.position,
    employeeStatus: response.employeeStatus,
    employmentType: response.employmentType,
    email: response.email,
    
    // Default values for fields not in list response
    aipAccessLevel: '',
    region: '',
    contactNumber: '',
    houseName: '',
    numberAndStreet: '',
    town: '',
    county: '',
    postCode: '',
    siaLicenceType: response.siaLicenceType || '',
    siaLicenceExpiry: response.siaLicenceExpiry ? new Date(response.siaLicenceExpiry) : null,
    nationality: '',
    rightToWorkCondition: '',
    drivingLicenceType: '',
    dateDLChecked: null,
    drivingLicenceCopyTaken: false,
    sixMonthlyCheck: false,
    graydonCheckAuthorised: false,
    graydonCheckDetails: '',
    initialOralReferencesComplete: false,
    initialOralReferencesDate: null,
    writtenRefsComplete: false,
    writtenRefsCompleteDate: null,
    quickStarterFormCompleted: false,
    workingTimeDirective: '',
    workingTimeDirectiveComplete: false,
    contractOfEmploymentSigned: false,
    photoTaken: false,
    photoFile: '',
    idCardIssued: false,
    equipmentIssued: false,
    uniformIssued: false,
    nextOfKinDetailsComplete: false,
    peopleHoursPin: '',
    fullRotasIssued: null,
    inductionAndTrainingBooked: null,
    location: '',
    trainer: '',
    userId: response.userId,
    createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
    createdBy: '',
    updatedAt: null,
    updatedBy: '',
    fullName: response.fullName,
    isSiaLicenceExpired: response.isSiaLicenceExpired || false,
    isSiaLicenceExpiringSoon: response.isSiaLicenceExpiringSoon || false,
  }
}

/**
 * Maps an array of backend EmployeeListResponseDto to frontend Employee interfaces
 */
export const mapFromListResponseArray = (responses: any[]): Employee[] => {
  return responses.map(mapFromListResponse)
}

/**
 * Maps frontend Employee interface to backend EmployeeUpdateRequestDto
 * Used specifically for PUT operations - all fields are optional
 */
export const mapToBackendUpdateRequest = (employee: Partial<Employee>): any => {
  return {
    // Only include defined values for update
    ...(employee.employeeNumber && { EmployeeNumber: employee.employeeNumber }),
    ...(employee.title && { Title: employee.title }),
    ...(employee.aipAccessLevel && { AipAccessLevel: employee.aipAccessLevel }),
    ...(employee.firstName && { FirstName: employee.firstName }),
    ...(employee.surname && { Surname: employee.surname }),
    ...(employee.startDate && { StartDate: new Date(employee.startDate) }),
    ...(employee.position && { Position: employee.position }),
    ...(employee.employeeStatus && { EmployeeStatus: employee.employeeStatus }),
    ...(employee.employmentType && { EmploymentType: employee.employmentType }),
    ...(employee.region && { Region: employee.region }),
    ...(employee.email && { Email: employee.email }),
    ...(employee.contactNumber && { ContactNumber: employee.contactNumber }),
    ...(employee.houseName && { HouseName: employee.houseName }),
    ...(employee.numberAndStreet && { NumberAndStreet: employee.numberAndStreet }),
    ...(employee.town && { Town: employee.town }),
    ...(employee.county && { County: employee.county }),
    ...(employee.postCode && { PostCode: employee.postCode }),
    ...(employee.siaLicenceType && { SiaLicenceType: employee.siaLicenceType }),
    ...(employee.siaLicenceExpiry && { SiaLicenceExpiry: new Date(employee.siaLicenceExpiry) }),
    ...(employee.nationality && { Nationality: employee.nationality }),
    ...(employee.rightToWorkCondition && { RightToWorkCondition: employee.rightToWorkCondition }),
    ...(employee.drivingLicenceType && { DrivingLicenceType: employee.drivingLicenceType }),
    ...(employee.dateDLChecked && { DateDLChecked: new Date(employee.dateDLChecked) }),
    ...(employee.drivingLicenceCopyTaken !== undefined && { DrivingLicenceCopyTaken: employee.drivingLicenceCopyTaken }),
    ...(employee.sixMonthlyCheck !== undefined && { SixMonthlyCheck: employee.sixMonthlyCheck }),
    ...(employee.graydonCheckAuthorised !== undefined && { GraydonCheckAuthorised: employee.graydonCheckAuthorised }),
    ...(employee.graydonCheckDetails && { GraydonCheckDetails: employee.graydonCheckDetails }),
    ...(employee.initialOralReferencesComplete !== undefined && { InitialOralReferencesComplete: employee.initialOralReferencesComplete }),
    ...(employee.initialOralReferencesDate && { InitialOralReferencesDate: new Date(employee.initialOralReferencesDate) }),
    ...(employee.writtenRefsComplete !== undefined && { WrittenRefsComplete: employee.writtenRefsComplete }),
    ...(employee.writtenRefsCompleteDate && { WrittenRefsCompleteDate: new Date(employee.writtenRefsCompleteDate) }),
    ...(employee.quickStarterFormCompleted !== undefined && { QuickStarterFormCompleted: employee.quickStarterFormCompleted }),
    ...(employee.workingTimeDirective && { WorkingTimeDirective: employee.workingTimeDirective }),
    ...(employee.workingTimeDirectiveComplete !== undefined && { WorkingTimeDirectiveComplete: employee.workingTimeDirectiveComplete }),
    ...(employee.contractOfEmploymentSigned !== undefined && { ContractOfEmploymentSigned: employee.contractOfEmploymentSigned }),
    ...(employee.photoTaken !== undefined && { PhotoTaken: employee.photoTaken }),
    ...(employee.photoFile && { PhotoFile: employee.photoFile }),
    ...(employee.idCardIssued !== undefined && { IdCardIssued: employee.idCardIssued }),
    ...(employee.equipmentIssued !== undefined && { EquipmentIssued: employee.equipmentIssued }),
    ...(employee.uniformIssued !== undefined && { UniformIssued: employee.uniformIssued }),
    ...(employee.nextOfKinDetailsComplete !== undefined && { NextOfKinDetailsComplete: employee.nextOfKinDetailsComplete }),
    ...(employee.peopleHoursPin && { PeopleHoursPin: employee.peopleHoursPin }),
    ...(employee.fullRotasIssued && { FullRotasIssued: new Date(employee.fullRotasIssued) }),
    ...(employee.inductionAndTrainingBooked && { InductionAndTrainingBooked: new Date(employee.inductionAndTrainingBooked) }),
    ...(employee.location && { Location: employee.location }),
    ...(employee.trainer && { Trainer: employee.trainer }),
  }
}

/**
 * Validates that all required fields are present for employee registration
 */
export const validateEmployeeRegistration = (employee: Partial<Employee>): string[] => {
  const errors: string[] = []
  
  // Required fields validation
  if (!employee.employeeNumber) errors.push('Employee number is required')
  if (!employee.title) errors.push('Title is required')
  if (!employee.firstName) errors.push('First name is required')
  if (!employee.surname) errors.push('Surname is required')
  if (!employee.startDate) errors.push('Start date is required')
  if (!employee.position) errors.push('Position is required')
  if (!employee.employeeStatus) errors.push('Employee status is required')
  if (!employee.employmentType) errors.push('Employment type is required')
  if (!employee.numberAndStreet) errors.push('Number and street is required')
  if (!employee.town) errors.push('Town is required')
  if (!employee.county) errors.push('County is required')
  if (!employee.postCode) errors.push('Post code is required')
  if (!employee.region) errors.push('Region is required')
  if (!employee.nationality) errors.push('Nationality is required')
  if (!employee.rightToWorkCondition) errors.push('Right to work condition is required')
  if (!employee.drivingLicenceType) errors.push('Driving licence type is required')
  
  return errors
}

/**
 * Generates a unique employee number if not provided
 */
export const generateEmployeeNumber = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `EMP${timestamp}${random}`.toUpperCase()
}

/**
 * Formats date for backend API (ISO string)
 */
export const formatDateForBackend = (date: Date | string | null): string | null => {
  if (!date) return null
  if (typeof date === 'string') return date
  return date.toISOString()
}

/**
 * Formats date for frontend display
 */
export const formatDateForFrontend = (dateString: string | null): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB')
  } catch {
    return dateString
  }
}
