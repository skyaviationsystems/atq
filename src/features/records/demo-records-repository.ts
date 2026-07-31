import { buildPeopleFacets, buildRecordFacets, createRecordsRepository } from "./records-repository";
import type {
    CredentialRecord,
    PersonEmploymentStatus,
    PersonQualificationState,
    QualificationChange,
    QualificationRecord,
    RestrictionRecord,
    TrainingFormState,
    TrainingOutcome,
    TrainingPerson,
    TrainingPopulation,
    TrainingProgramType,
    TrainingRecord,
} from "./types";

export const DEMO_RECORDS_AS_OF_DATE = "2026-07-30";

type TrainingTrack = "b747" | "b767" | "b777" | "cabin" | "ground";

interface PersonSeed {
    id: string;
    employeeNumber: string;
    displayName: string;
    preferredName: string;
    employmentStatus: PersonEmploymentStatus;
    population: TrainingPopulation;
    roleTitle: string;
    department: string;
    track: TrainingTrack;
    fleetCode: string;
    seatCode: string;
    baseCode: string;
    hireDate: string;
    isInstructor: boolean;
    isEvaluator: boolean;
    isCheckPilot: boolean;
    programType: TrainingProgramType;
    qualificationState: PersonQualificationState;
    nextDueDate?: string;
    recordCompleteness: number;
    primaryEventDate: string;
    secondaryEventDate: string;
    primaryExpirationDate?: string;
    primaryOutcome?: TrainingOutcome;
    secondaryOutcome?: TrainingOutcome;
    restriction?: {
        code: string;
        title: string;
        description: string;
        status: RestrictionRecord["status"];
        effectiveDate: string;
        clearedDate?: string;
        sourceRecord: 1 | 2;
    };
}

interface TaskTemplate {
    taskId: string;
    visionTaskId: number;
    taskTitle: string;
    outlineNumber: string;
    moduleCode: string;
    moduleTitle: string;
    deviceCode: string;
    deviceType: string;
}

const personSeeds: readonly PersonSeed[] = [
    {
        id: "person-syn-1001",
        employeeNumber: "SYN-ATQ-1001",
        displayName: "Avery Morgan",
        preferredName: "Avery",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B747 Captain",
        department: "Flight Operations",
        track: "b747",
        fleetCode: "B747",
        seatCode: "CA",
        baseCode: "ANC",
        hireDate: "2014-06-09",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "AQP",
        qualificationState: "current",
        nextDueDate: "2027-03-31",
        recordCompleteness: 100,
        primaryEventDate: "2026-03-14",
        secondaryEventDate: "2025-11-08",
        primaryExpirationDate: "2027-03-31",
    },
    {
        id: "person-syn-1002",
        employeeNumber: "SYN-ATQ-1002",
        displayName: "Jordan Blake",
        preferredName: "Jordan",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B747 First Officer",
        department: "Flight Operations",
        track: "b747",
        fleetCode: "B747",
        seatCode: "FO",
        baseCode: "CVG",
        hireDate: "2019-03-18",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "AQP",
        qualificationState: "expiring",
        nextDueDate: "2026-09-30",
        recordCompleteness: 96,
        primaryEventDate: "2025-09-12",
        secondaryEventDate: "2026-02-20",
        primaryExpirationDate: "2026-09-30",
    },
    {
        id: "person-syn-1003",
        employeeNumber: "SYN-ATQ-1003",
        displayName: "Casey Rivera",
        preferredName: "Casey",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B767 Captain",
        department: "Flight Operations",
        track: "b767",
        fleetCode: "B767",
        seatCode: "CA",
        baseCode: "MIA",
        hireDate: "2012-11-05",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "NO",
        qualificationState: "current",
        nextDueDate: "2027-05-31",
        recordCompleteness: 98,
        primaryEventDate: "2026-05-03",
        secondaryEventDate: "2025-12-11",
        primaryExpirationDate: "2027-05-31",
    },
    {
        id: "person-syn-1004",
        employeeNumber: "SYN-ATQ-1004",
        displayName: "Cameron Hayes",
        preferredName: "Cameron",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B767 First Officer",
        department: "Flight Operations",
        track: "b767",
        fleetCode: "B767",
        seatCode: "FO",
        baseCode: "CVG",
        hireDate: "2025-10-13",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "NO",
        qualificationState: "in-progress",
        recordCompleteness: 84,
        primaryEventDate: "2026-07-18",
        secondaryEventDate: "2026-07-12",
        primaryOutcome: "incomplete",
        restriction: {
            code: "SUPERVISED-OPS",
            title: "Supervised operations only",
            description: "Synthetic training restriction while the initial qualification sequence remains in progress.",
            status: "active",
            effectiveDate: "2026-07-18",
            sourceRecord: 1,
        },
    },
    {
        id: "person-syn-1005",
        employeeNumber: "SYN-ATQ-1005",
        displayName: "Dakota Brooks",
        preferredName: "Dakota",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B777 Check Pilot",
        department: "Flight Standards",
        track: "b777",
        fleetCode: "B777",
        seatCode: "CA",
        baseCode: "LAX",
        hireDate: "2009-02-23",
        isInstructor: true,
        isEvaluator: true,
        isCheckPilot: true,
        programType: "AQP",
        qualificationState: "current",
        nextDueDate: "2027-06-30",
        recordCompleteness: 100,
        primaryEventDate: "2026-06-21",
        secondaryEventDate: "2026-01-08",
        primaryExpirationDate: "2027-06-30",
    },
    {
        id: "person-syn-1006",
        employeeNumber: "SYN-ATQ-1006",
        displayName: "Emerson Quinn",
        preferredName: "Emerson",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B777 First Officer",
        department: "Flight Operations",
        track: "b777",
        fleetCode: "B777",
        seatCode: "FO",
        baseCode: "ANC",
        hireDate: "2018-08-27",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "AQP",
        qualificationState: "expired",
        recordCompleteness: 92,
        primaryEventDate: "2025-05-17",
        secondaryEventDate: "2025-11-04",
        primaryExpirationDate: "2026-05-31",
        restriction: {
            code: "REQUAL-REQUIRED",
            title: "Requalification required",
            description: "Synthetic qualification is past its calculated expiration date; this is not an operational determination.",
            status: "active",
            effectiveDate: "2026-06-01",
            sourceRecord: 1,
        },
    },
    {
        id: "person-syn-1007",
        employeeNumber: "SYN-ATQ-1007",
        displayName: "Finley Hart",
        preferredName: "Finley",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B747 Instructor Pilot",
        department: "Flight Training",
        track: "b747",
        fleetCode: "B747",
        seatCode: "CA",
        baseCode: "CVG",
        hireDate: "2011-04-04",
        isInstructor: true,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "AQP",
        qualificationState: "current",
        nextDueDate: "2027-04-30",
        recordCompleteness: 99,
        primaryEventDate: "2026-04-09",
        secondaryEventDate: "2026-06-29",
        primaryExpirationDate: "2027-04-30",
    },
    {
        id: "person-syn-1008",
        employeeNumber: "SYN-ATQ-1008",
        displayName: "Harper Ellis",
        preferredName: "Harper",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B767 Evaluator",
        department: "Flight Standards",
        track: "b767",
        fleetCode: "B767",
        seatCode: "CA",
        baseCode: "MIA",
        hireDate: "2010-09-20",
        isInstructor: true,
        isEvaluator: true,
        isCheckPilot: true,
        programType: "NO",
        qualificationState: "current",
        nextDueDate: "2027-02-28",
        recordCompleteness: 100,
        primaryEventDate: "2026-02-27",
        secondaryEventDate: "2026-06-15",
        primaryExpirationDate: "2027-02-28",
        restriction: {
            code: "DEVICE-LIMIT",
            title: "Prior device limitation cleared",
            description: "A synthetic historical limitation retained for audit visibility.",
            status: "cleared",
            effectiveDate: "2025-02-10",
            clearedDate: "2025-03-03",
            sourceRecord: 2,
        },
    },
    {
        id: "person-syn-1009",
        employeeNumber: "SYN-ATQ-1009",
        displayName: "Morgan Lane",
        preferredName: "Morgan",
        employmentStatus: "active",
        population: "flight-attendant",
        roleTitle: "Flight Attendant",
        department: "Inflight Services",
        track: "cabin",
        fleetCode: "CABIN",
        seatCode: "FA",
        baseCode: "JFK",
        hireDate: "2020-01-13",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "NO",
        qualificationState: "current",
        nextDueDate: "2027-01-31",
        recordCompleteness: 97,
        primaryEventDate: "2026-01-24",
        secondaryEventDate: "2025-10-15",
        primaryExpirationDate: "2027-01-31",
    },
    {
        id: "person-syn-1010",
        employeeNumber: "SYN-ATQ-1010",
        displayName: "Parker Rowan",
        preferredName: "Parker",
        employmentStatus: "active",
        population: "flight-attendant",
        roleTitle: "Flight Attendant",
        department: "Inflight Services",
        track: "cabin",
        fleetCode: "CABIN",
        seatCode: "FA",
        baseCode: "LAX",
        hireDate: "2017-07-31",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "NO",
        qualificationState: "expiring",
        nextDueDate: "2026-09-30",
        recordCompleteness: 94,
        primaryEventDate: "2025-09-01",
        secondaryEventDate: "2026-03-16",
        primaryExpirationDate: "2026-09-30",
    },
    {
        id: "person-syn-1011",
        employeeNumber: "SYN-ATQ-1011",
        displayName: "Reese Cameron",
        preferredName: "Reese",
        employmentStatus: "active",
        population: "flight-attendant",
        roleTitle: "Cabin Safety Instructor",
        department: "Inflight Training",
        track: "cabin",
        fleetCode: "CABIN",
        seatCode: "FA",
        baseCode: "ANC",
        hireDate: "2015-12-07",
        isInstructor: true,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "NO",
        qualificationState: "current",
        nextDueDate: "2027-05-31",
        recordCompleteness: 100,
        primaryEventDate: "2026-05-29",
        secondaryEventDate: "2026-07-10",
        primaryExpirationDate: "2027-05-31",
    },
    {
        id: "person-syn-1012",
        employeeNumber: "SYN-ATQ-1012",
        displayName: "Sage Bennett",
        preferredName: "Sage",
        employmentStatus: "active",
        population: "ground-instructor",
        roleTitle: "Ground Training Instructor",
        department: "Ground Training",
        track: "ground",
        fleetCode: "GROUND",
        seatCode: "GI",
        baseCode: "CVG",
        hireDate: "2016-05-16",
        isInstructor: true,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "NO",
        qualificationState: "current",
        nextDueDate: "2027-05-31",
        recordCompleteness: 99,
        primaryEventDate: "2026-05-19",
        secondaryEventDate: "2026-06-18",
        primaryExpirationDate: "2027-05-31",
    },
    {
        id: "person-syn-1013",
        employeeNumber: "SYN-ATQ-1013",
        displayName: "Taylor Monroe",
        preferredName: "Taylor",
        employmentStatus: "active",
        population: "pilot",
        roleTitle: "B747 Check Pilot",
        department: "Flight Standards",
        track: "b747",
        fleetCode: "B747",
        seatCode: "CA",
        baseCode: "CVG",
        hireDate: "2007-03-12",
        isInstructor: true,
        isEvaluator: true,
        isCheckPilot: true,
        programType: "AQP",
        qualificationState: "current",
        nextDueDate: "2027-07-31",
        recordCompleteness: 100,
        primaryEventDate: "2026-07-02",
        secondaryEventDate: "2026-07-15",
        primaryExpirationDate: "2027-07-31",
    },
    {
        id: "person-syn-1014",
        employeeNumber: "SYN-ATQ-1014",
        displayName: "Rowan Avery",
        preferredName: "Rowan",
        employmentStatus: "leave",
        population: "pilot",
        roleTitle: "B777 First Officer",
        department: "Flight Operations",
        track: "b777",
        fleetCode: "B777",
        seatCode: "FO",
        baseCode: "LAX",
        hireDate: "2021-06-14",
        isInstructor: false,
        isEvaluator: false,
        isCheckPilot: false,
        programType: "AQP",
        qualificationState: "suspended",
        nextDueDate: "2026-08-31",
        recordCompleteness: 88,
        primaryEventDate: "2026-04-02",
        secondaryEventDate: "2025-08-12",
        primaryExpirationDate: "2026-08-31",
        primaryOutcome: "unsatisfactory",
        restriction: {
            code: "QUAL-SUSPENDED",
            title: "Operating qualification suspended",
            description: "Synthetic restriction linked to an unresolved training outcome and leave status.",
            status: "active",
            effectiveDate: "2026-04-02",
            sourceRecord: 1,
        },
    },
];

const taskTemplates: Record<TrainingTrack, { primary: TaskTemplate; secondary: TaskTemplate }> = {
    b747: {
        primary: {
            taskId: "TASK-B747-RTO-001",
            visionTaskId: 7471001,
            taskTitle: "Rejected takeoff decision and execution",
            outlineNumber: "B747.6.2.1",
            moduleCode: "B747-SIM-CQ",
            moduleTitle: "B747 recurrent simulator",
            deviceCode: "FFS-747-04",
            deviceType: "B747 full-flight simulator",
        },
        secondary: {
            taskId: "TASK-B747-FMS-014",
            visionTaskId: 7471014,
            taskTitle: "Flight management system route revision",
            outlineNumber: "B747.6.4.3",
            moduleCode: "B747-SYS-CQ",
            moduleTitle: "B747 systems and procedures",
            deviceCode: "FTD-747-02",
            deviceType: "B747 flight training device",
        },
    },
    b767: {
        primary: {
            taskId: "TASK-B767-HYD-004",
            visionTaskId: 7672004,
            taskTitle: "Hydraulic system prioritization",
            outlineNumber: "B767.5.3.2",
            moduleCode: "B767-SIM-CQ",
            moduleTitle: "B767 recurrent simulator",
            deviceCode: "FFS-767-02",
            deviceType: "B767 full-flight simulator",
        },
        secondary: {
            taskId: "TASK-B767-APP-011",
            visionTaskId: 7672011,
            taskTitle: "Low-visibility approach preparation",
            outlineNumber: "B767.5.7.1",
            moduleCode: "B767-PROC-CQ",
            moduleTitle: "B767 procedures review",
            deviceCode: "FTD-767-03",
            deviceType: "B767 flight training device",
        },
    },
    b777: {
        primary: {
            taskId: "TASK-B777-UPRT-002",
            visionTaskId: 7773002,
            taskTitle: "Upset recognition and recovery",
            outlineNumber: "B777.7.2.4",
            moduleCode: "B777-SIM-CQ",
            moduleTitle: "B777 recurrent simulator",
            deviceCode: "FFS-777-06",
            deviceType: "B777 full-flight simulator",
        },
        secondary: {
            taskId: "TASK-B777-RNAV-015",
            visionTaskId: 7773015,
            taskTitle: "RNAV arrival monitoring",
            outlineNumber: "B777.7.5.3",
            moduleCode: "B777-PROC-CQ",
            moduleTitle: "B777 procedures review",
            deviceCode: "FTD-777-01",
            deviceType: "B777 flight training device",
        },
    },
    cabin: {
        primary: {
            taskId: "TASK-FA-EVAC-004",
            visionTaskId: 8804004,
            taskTitle: "Evacuation command and exit assessment",
            outlineNumber: "CAB.4.2",
            moduleCode: "FA-DRILL-CQ",
            moduleTitle: "Cabin emergency drills",
            deviceCode: "CABIN-DRILL-03",
            deviceType: "Cabin emergency procedures trainer",
        },
        secondary: {
            taskId: "TASK-FA-CRM-011",
            visionTaskId: 8804011,
            taskTitle: "Cabin crew coordination and communication",
            outlineNumber: "CAB.6.1",
            moduleCode: "FA-CRM-CQ",
            moduleTitle: "Cabin crew resource management",
            deviceCode: "CLASSROOM-JFK-08",
            deviceType: "Instructor-led classroom",
        },
    },
    ground: {
        primary: {
            taskId: "TASK-GND-FAC-003",
            visionTaskId: 9905003,
            taskTitle: "Facilitate scenario-based instruction",
            outlineNumber: "GND.3.3",
            moduleCode: "GND-INSTR-QUAL",
            moduleTitle: "Ground instructor qualification",
            deviceCode: "CLASSROOM-CVG-12",
            deviceType: "Instructor-led classroom",
        },
        secondary: {
            taskId: "TASK-GND-REC-006",
            visionTaskId: 9905006,
            taskTitle: "Training record review and closeout",
            outlineNumber: "GND.5.2",
            moduleCode: "GND-REC-STAND",
            moduleTitle: "Records governance standardization",
            deviceCode: "LAB-CVG-02",
            deviceType: "Training systems lab",
        },
    },
};

const instructorTask: TaskTemplate = {
    taskId: "TASK-INSTR-STAND-001",
    visionTaskId: 9901001,
    taskTitle: "Instructor delivery and debrief standardization",
    outlineNumber: "INST.2.1",
    moduleCode: "INSTR-STAND",
    moduleTitle: "Instructor standardization",
    deviceCode: "CLASSROOM-CVG-04",
    deviceType: "Instructor standardization lab",
};

const evaluatorTask: TaskTemplate = {
    taskId: "TASK-EVAL-CAL-002",
    visionTaskId: 9902002,
    taskTitle: "Evaluator calibration and evidence review",
    outlineNumber: "EVAL.3.2",
    moduleCode: "EVAL-CAL",
    moduleTitle: "Evaluator calibration",
    deviceCode: "LAB-CVG-06",
    deviceType: "Evaluation calibration lab",
};

const numericSuffix = (seed: PersonSeed) => seed.employeeNumber.slice(-4);
const recordId = (seed: PersonSeed, index: 1 | 2) => `record-syn-${numericSuffix(seed)}-${index.toString().padStart(2, "0")}`;
const formId = (seed: PersonSeed, index: 1 | 2) => `FRM-SYN-${numericSuffix(seed)}-${index.toString().padStart(2, "0")}`;
const qualificationId = (seed: PersonSeed, kind: "primary" | "recurrent" | "instructor" | "evaluator") => `qual-syn-${numericSuffix(seed)}-${kind}`;

const programNameFor = (type: TrainingProgramType) => (type === "AQP" ? "Advanced Qualification Program" : "Subpart N&O");
const programCodeFor = (seed: PersonSeed) => `ATLAS-${seed.fleetCode}-${seed.programType}`;
const curriculumCodeFor = (seed: PersonSeed) =>
    seed.track === "ground" ? "GND-INSTR-QUAL" : seed.track === "cabin" ? "FA-NO-CQ" : `${seed.fleetCode}-${seed.programType}-CQ`;
const curriculumTitleFor = (seed: PersonSeed) => {
    if (seed.track === "ground") return "Synthetic ground instructor qualification";
    if (seed.track === "cabin") return "Synthetic flight attendant recurrent";
    return `Synthetic ${seed.fleetCode} ${seed.programType} continuing qualification`;
};

const instructorFor = (seed: PersonSeed) => {
    if (seed.id === "person-syn-1013") return { id: "person-syn-1008", name: "Harper Ellis" };
    if (seed.track === "b767" || seed.track === "ground") return { id: "person-syn-1008", name: "Harper Ellis" };
    if (seed.track === "cabin") return { id: "person-syn-1011", name: "Reese Cameron" };
    return { id: "person-syn-1013", name: "Taylor Monroe" };
};

const secondaryTaskFor = (seed: PersonSeed) => {
    if (seed.isEvaluator) return evaluatorTask;
    if (seed.isInstructor) return instructorTask;
    return taskTemplates[seed.track].secondary;
};

const primaryQualificationFor = (seed: PersonSeed) => {
    if (seed.track === "cabin") {
        return { code: "QUAL-FA-CQ", title: "Flight attendant recurrent qualification", category: "cabin" as const };
    }
    if (seed.track === "ground") {
        return { code: "QUAL-GND-INSTR", title: "Ground instructor qualification", category: "ground" as const };
    }
    return {
        code: `QUAL-${seed.fleetCode}-${seed.seatCode}`,
        title: `${seed.fleetCode} ${seed.seatCode} operating qualification`,
        category: "fleet" as const,
    };
};

const secondaryQualificationFor = (seed: PersonSeed) => {
    if (seed.track === "cabin") return { code: "CURR-FA-CRM", title: "Cabin crew resource management", category: "currency" as const };
    if (seed.track === "ground") return { code: "CURR-GND-REC", title: "Training records standardization", category: "ground" as const };
    return { code: `CURR-${seed.fleetCode}-CRM`, title: `${seed.fleetCode} crew resource management`, category: "currency" as const };
};

const formNameFor = (seed: PersonSeed, index: 1 | 2) => {
    if (index === 2 && seed.isEvaluator) return "Evaluator Calibration Record";
    if (index === 2 && seed.isInstructor) return "Instructor Standardization Record";
    if (seed.track === "cabin") return index === 1 ? "Cabin Competency Record" : "Cabin CRM Training Record";
    if (seed.track === "ground") return index === 1 ? "Ground Instructor Qualification Record" : "Records Standardization Record";
    return index === 1 ? `${seed.programType} CQ Evaluation Record` : `${seed.fleetCode} Recurrent Training Record`;
};

const formStateFor = (outcome: TrainingOutcome): TrainingFormState => {
    if (outcome === "incomplete") return "qc-review";
    if (outcome === "unsatisfactory") return "qc-returned";
    return "approved";
};

const buildTrainingRecord = (seed: PersonSeed, index: 1 | 2): TrainingRecord => {
    const task = index === 1 ? taskTemplates[seed.track].primary : secondaryTaskFor(seed);
    const outcome = index === 1 ? (seed.primaryOutcome ?? "satisfactory") : (seed.secondaryOutcome ?? "satisfactory");
    const instructor = instructorFor(seed);
    const primaryQualification = primaryQualificationFor(seed);
    const effectQualification =
        index === 1
            ? {
                  id: qualificationId(seed, "primary"),
                  code: primaryQualification.code,
                  title: primaryQualification.title,
              }
            : seed.isEvaluator
              ? {
                    id: qualificationId(seed, "evaluator"),
                    code: "AUTH-EVALUATOR",
                    title: "Evaluator authorization",
                }
              : seed.isInstructor
                ? {
                      id: qualificationId(seed, "instructor"),
                      code: "AUTH-INSTRUCTOR",
                      title: "Instructor authorization",
                  }
                : {
                      id: qualificationId(seed, "recurrent"),
                      code: secondaryQualificationFor(seed).code,
                      title: secondaryQualificationFor(seed).title,
                  };
    const effectType = outcome === "incomplete" ? "no-change" : outcome === "unsatisfactory" ? "restricted" : index === 1 ? "renewed" : "renewed";
    const eventDate = index === 1 ? seed.primaryEventDate : seed.secondaryEventDate;
    const eventType =
        index === 1
            ? seed.track === "cabin"
                ? "Cabin recurrent evaluation"
                : seed.track === "ground"
                  ? "Instructor qualification"
                  : "CQ evaluation"
            : seed.isEvaluator
              ? "Evaluator standardization"
              : seed.isInstructor
                ? "Instructor standardization"
                : "Recurrent ground";

    return {
        id: recordId(seed, index),
        recordNumber: `ATQ-SYN-REC-${numericSuffix(seed)}-${index.toString().padStart(2, "0")}`,
        personId: seed.id,
        personName: seed.displayName,
        employeeNumber: seed.employeeNumber,
        population: seed.population,
        fleetCode: seed.fleetCode,
        seatCode: seed.seatCode,
        baseCode: seed.baseCode,
        taskId: task.taskId,
        visionTaskId: task.visionTaskId,
        taskTitle: task.taskTitle,
        outlineNumber: task.outlineNumber,
        curriculumId: `curriculum-syn-${curriculumCodeFor(seed).toLocaleLowerCase()}`,
        curriculumCode: curriculumCodeFor(seed),
        curriculumTitle: curriculumTitleFor(seed),
        curriculumVersion: seed.programType === "AQP" ? "2026.1" : "2026.2",
        moduleCode: task.moduleCode,
        moduleTitle: task.moduleTitle,
        eventId: `EVT-SYN-${numericSuffix(seed)}-${index.toString().padStart(2, "0")}`,
        eventType,
        eventDate,
        eventLocation: seed.baseCode,
        formId: formId(seed, index),
        formName: formNameFor(seed, index),
        formState: formStateFor(outcome),
        outcome,
        instructorId: instructor.id,
        instructorName: instructor.name,
        deviceCode: task.deviceCode,
        deviceType: task.deviceType,
        programType: seed.programType,
        programCode: programCodeFor(seed),
        attempt: outcome === "unsatisfactory" ? 2 : 1,
        score: outcome === "satisfactory" ? 4 : outcome === "credited" ? undefined : outcome === "unsatisfactory" ? 1 : undefined,
        remarks:
            outcome === "incomplete"
                ? "Synthetic record remains open pending the remaining curriculum items."
                : outcome === "unsatisfactory"
                  ? "Synthetic outcome retained to exercise remediation and restriction workflows."
                  : "Synthetic demonstration evidence; no approved training content or real personnel data.",
        qualificationEffect: {
            type: effectType,
            qualificationId: effectQualification.id,
            requirementCode: effectQualification.code,
            qualificationTitle: effectQualification.title,
            effectiveDate: outcome === "incomplete" ? undefined : eventDate,
            expirationDate: index === 1 ? seed.primaryExpirationDate : "2027-06-30",
            explanation:
                outcome === "incomplete"
                    ? "No qualification change is posted until the synthetic event is complete and approved."
                    : outcome === "unsatisfactory"
                      ? "The synthetic outcome places the linked qualification into a restricted state."
                      : `Approved synthetic evidence ${effectType} the linked qualification.`,
        },
        synthetic: true,
    };
};

export const trainingRecords: readonly TrainingRecord[] = Object.freeze(
    personSeeds.flatMap((seed) => [buildTrainingRecord(seed, 1), buildTrainingRecord(seed, 2)]),
);

const historyForPrimary = (seed: PersonSeed): QualificationChange[] => {
    if (seed.qualificationState === "in-progress") return [];

    const base: QualificationChange[] = [
        {
            id: `qchange-${numericSuffix(seed)}-primary-01`,
            effectiveDate: seed.primaryEventDate,
            action: seed.qualificationState === "suspended" ? "suspended" : "renewed",
            fromStatus: seed.qualificationState === "suspended" ? "current" : undefined,
            toStatus: seed.qualificationState === "suspended" ? "suspended" : "current",
            sourceRecordId: recordId(seed, 1),
            note:
                seed.qualificationState === "suspended"
                    ? "Synthetic linked outcome suspended the qualification pending resolution."
                    : "Qualification status recalculated from an approved synthetic record.",
        },
    ];

    if (seed.qualificationState === "expired" && seed.primaryExpirationDate) {
        base.push({
            id: `qchange-${numericSuffix(seed)}-primary-02`,
            effectiveDate: seed.primaryExpirationDate,
            action: "expired",
            fromStatus: "current",
            toStatus: "expired",
            sourceRecordId: recordId(seed, 1),
            note: "Synthetic expiration reached with no later granting record.",
        });
    }

    return base;
};

const buildQualifications = (seed: PersonSeed): QualificationRecord[] => {
    const primary = primaryQualificationFor(seed);
    const secondary = secondaryQualificationFor(seed);
    const primaryStatus = seed.qualificationState;
    const common = {
        personId: seed.id,
        programType: seed.programType,
        fleetCode: seed.fleetCode,
        seatCode: seed.seatCode,
        synthetic: true as const,
    };
    const result: QualificationRecord[] = [
        {
            ...common,
            id: qualificationId(seed, "primary"),
            requirementCode: primary.code,
            title: primary.title,
            category: primary.category,
            status: primaryStatus,
            lastCompletedDate: seed.primaryOutcome === "incomplete" ? undefined : seed.primaryEventDate,
            effectiveDate: seed.primaryOutcome === "incomplete" ? undefined : seed.primaryEventDate,
            expirationDate: seed.primaryExpirationDate,
            nextDueDate: seed.nextDueDate,
            baseMonth: seed.population === "pilot" && seed.primaryExpirationDate ? Number(seed.primaryExpirationDate.slice(5, 7)) : undefined,
            sourceRecordId: recordId(seed, 1),
            sourceFormId: formId(seed, 1),
            sourceFormName: formNameFor(seed, 1),
            calculationSummary:
                primaryStatus === "in-progress"
                    ? "The synthetic curriculum is open; no granting record has been posted."
                    : primaryStatus === "suspended"
                      ? "A synthetic unsatisfactory outcome is the current controlling evidence."
                      : primaryStatus === "expired"
                        ? `The last synthetic granting record expired on ${seed.primaryExpirationDate}.`
                        : `Status is derived from the approved record dated ${seed.primaryEventDate} and its synthetic due-date rule.`,
            history: historyForPrimary(seed),
            synthetic: true,
        },
        {
            ...common,
            id: qualificationId(seed, "recurrent"),
            requirementCode: secondary.code,
            title: secondary.title,
            category: secondary.category,
            status: "current",
            lastCompletedDate: seed.secondaryEventDate,
            effectiveDate: seed.secondaryEventDate,
            expirationDate: "2027-06-30",
            nextDueDate: "2027-06-30",
            graceDate: "2027-07-31",
            nextPlannedDate: seed.qualificationState === "expiring" ? "2026-08-18" : undefined,
            sourceRecordId: recordId(seed, 2),
            sourceFormId: formId(seed, 2),
            sourceFormName: formNameFor(seed, 2),
            calculationSummary: "Current based on the latest approved synthetic recurrent-training record.",
            history: [
                {
                    id: `qchange-${numericSuffix(seed)}-recurrent-01`,
                    effectiveDate: seed.secondaryEventDate,
                    action: "renewed",
                    toStatus: "current",
                    sourceRecordId: recordId(seed, 2),
                    note: "Synthetic recurrent-training evidence renewed this requirement.",
                },
            ],
            synthetic: true,
        },
    ];

    if (seed.isInstructor) {
        result.push({
            ...common,
            id: qualificationId(seed, "instructor"),
            requirementCode: "AUTH-INSTRUCTOR",
            title: "Instructor authorization",
            category: "instructor",
            status: "current",
            lastCompletedDate: seed.secondaryEventDate,
            effectiveDate: seed.secondaryEventDate,
            expirationDate: "2027-06-30",
            nextDueDate: "2027-06-30",
            sourceRecordId: recordId(seed, 2),
            sourceFormId: formId(seed, 2),
            sourceFormName: formNameFor(seed, 2),
            calculationSummary: "Current from the latest synthetic instructor standardization evidence.",
            history: [
                {
                    id: `qchange-${numericSuffix(seed)}-instructor-01`,
                    effectiveDate: seed.secondaryEventDate,
                    action: "renewed",
                    toStatus: "current",
                    sourceRecordId: recordId(seed, 2),
                    note: "Synthetic instructor standardization renewed the authorization.",
                },
            ],
            synthetic: true,
        });
    }

    if (seed.isEvaluator) {
        result.push({
            ...common,
            id: qualificationId(seed, "evaluator"),
            requirementCode: "AUTH-EVALUATOR",
            title: "Evaluator authorization",
            category: "evaluator",
            status: "current",
            lastCompletedDate: seed.secondaryEventDate,
            effectiveDate: seed.secondaryEventDate,
            expirationDate: "2027-06-30",
            nextDueDate: "2027-06-30",
            sourceRecordId: recordId(seed, 2),
            sourceFormId: formId(seed, 2),
            sourceFormName: formNameFor(seed, 2),
            calculationSummary: "Current from the latest synthetic evaluator calibration evidence.",
            history: [
                {
                    id: `qchange-${numericSuffix(seed)}-evaluator-01`,
                    effectiveDate: seed.secondaryEventDate,
                    action: "renewed",
                    toStatus: "current",
                    sourceRecordId: recordId(seed, 2),
                    note: "Synthetic evaluator calibration renewed the authorization.",
                },
            ],
            synthetic: true,
        });
    }

    return result;
};

export const qualifications: readonly QualificationRecord[] = Object.freeze(personSeeds.flatMap(buildQualifications));

const credentialStatusFor = (expirationDate: string): CredentialRecord["status"] => {
    if (expirationDate < DEMO_RECORDS_AS_OF_DATE) return "expired";
    if (expirationDate <= "2026-10-31") return "expiring";
    return "current";
};

const buildCredentials = (seed: PersonSeed): readonly CredentialRecord[] => {
    const suffix = numericSuffix(seed);
    const credentialExpiration = seed.qualificationState === "expired" ? "2026-05-31" : seed.qualificationState === "expiring" ? "2026-10-15" : "2028-12-31";
    const primary =
        seed.population === "pilot"
            ? {
                  type: "certificate" as const,
                  name: "Synthetic airman certificate",
                  issuer: "Synthetic credential registry",
                  credentialNumber: `SYN-ATP-${suffix}`,
              }
            : seed.population === "flight-attendant"
              ? {
                    type: "certificate" as const,
                    name: "Synthetic crew member certificate",
                    issuer: "Synthetic credential registry",
                    credentialNumber: `SYN-CAB-${suffix}`,
                }
              : {
                    type: "authorization" as const,
                    name: "Synthetic ground instructor authorization",
                    issuer: "Synthetic training standards",
                    credentialNumber: `SYN-GND-${suffix}`,
                };

    return [
        {
            id: `credential-syn-${suffix}-01`,
            personId: seed.id,
            ...primary,
            issuedDate: seed.hireDate,
            expirationDate: "2030-12-31",
            status: "current",
            synthetic: true,
        },
        {
            id: `credential-syn-${suffix}-02`,
            personId: seed.id,
            type: seed.population === "pilot" ? "medical" : "authorization",
            name: seed.population === "pilot" ? "Synthetic medical certificate" : "Synthetic operating authorization",
            credentialNumber: `SYN-AUTH-${suffix}`,
            issuer: "Synthetic credential registry",
            issuedDate: "2026-01-15",
            expirationDate: credentialExpiration,
            status: credentialStatusFor(credentialExpiration),
            synthetic: true,
        },
    ];
};

const buildRestrictions = (seed: PersonSeed): readonly RestrictionRecord[] => {
    if (!seed.restriction) return [];

    return [
        {
            id: `restriction-syn-${numericSuffix(seed)}-01`,
            personId: seed.id,
            code: seed.restriction.code,
            title: seed.restriction.title,
            description: seed.restriction.description,
            status: seed.restriction.status,
            effectiveDate: seed.restriction.effectiveDate,
            clearedDate: seed.restriction.clearedDate,
            sourceRecordId: recordId(seed, seed.restriction.sourceRecord),
            synthetic: true,
        },
    ];
};

export const recordPeople: readonly TrainingPerson[] = Object.freeze(
    personSeeds.map<TrainingPerson>((seed) => {
        const slug = seed.displayName.toLocaleLowerCase().replaceAll(" ", ".");
        return {
            id: seed.id,
            employeeNumber: seed.employeeNumber,
            displayName: seed.displayName,
            preferredName: seed.preferredName,
            email: `${slug}@example.invalid` as TrainingPerson["email"],
            phone: `+1 555 010 ${numericSuffix(seed)}`,
            employmentStatus: seed.employmentStatus,
            population: seed.population,
            roleTitle: seed.roleTitle,
            department: seed.department,
            fleetCode: seed.fleetCode,
            seatCode: seed.seatCode,
            baseCode: seed.baseCode,
            hireDate: seed.hireDate,
            isInstructor: seed.isInstructor,
            isEvaluator: seed.isEvaluator,
            isCheckPilot: seed.isCheckPilot,
            programType: seed.programType,
            programCode: programCodeFor(seed),
            programName: programNameFor(seed.programType),
            qualificationState: seed.qualificationState,
            nextDueDate: seed.nextDueDate,
            recordCompleteness: seed.recordCompleteness,
            qualifications: qualifications.filter((qualification) => qualification.personId === seed.id),
            credentials: buildCredentials(seed),
            restrictions: buildRestrictions(seed),
            trainingRecordIds: trainingRecords.filter((record) => record.personId === seed.id).map((record) => record.id),
            synthetic: true,
        };
    }),
);

export const peopleFacetOptions = buildPeopleFacets(recordPeople);
export const recordFacetOptions = buildRecordFacets(trainingRecords);

export const demoRecordsRepository = createRecordsRepository({
    people: recordPeople,
    records: trainingRecords,
    qualifications,
});
