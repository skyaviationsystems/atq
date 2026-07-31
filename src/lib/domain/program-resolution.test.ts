import { describe, expect, it } from "vitest";
import { DEMO_IDS, demoAqpResolutionInput, demoOverrideResolutionInput, demoProgramCatalog } from "../data/demo-data";
import { resolveProgram } from "./program-resolution";
import type { ISODate, ISODateTime } from "./types";

const date = (value: string) => value as ISODate;
const dateTime = (value: string) => value as ISODateTime;

describe("resolveProgram", () => {
    it("resolves implemented B747 CQ transition to AQP", () => {
        const result = resolveProgram(demoAqpResolutionInput, demoProgramCatalog);

        expect(result.status).toBe("resolved");
        expect(result.program?.type).toBe("AQP");
        expect(result.curriculumVersionId).toBe(DEMO_IDS.curriculumVersionAqp);
        expect(result.formDefinitionVersionId).toBe(DEMO_IDS.formVersionAqp);
        expect(result.source).toBe("transition");
    });

    it("gives an approved person-specific override precedence over MATS", () => {
        const result = resolveProgram(demoOverrideResolutionInput, demoProgramCatalog);

        expect(result.status).toBe("resolved");
        expect(result.program?.type).toBe("NO");
        expect(result.source).toBe("override");
        expect(result.reasoning.map((step) => step.message).join(" ")).toMatch(/individual override/i);
    });

    it("keeps a CQ cycle that started before transition in N&O", () => {
        const result = resolveProgram(
            {
                ...demoAqpResolutionInput,
                eventDate: date("2026-02-10"),
                cqCycleStartDate: date("2026-01-31"),
                asKnownAt: dateTime("2026-02-10T18:00:00Z"),
            },
            demoProgramCatalog,
        );

        expect(result.status).toBe("resolved");
        expect(result.program?.type).toBe("NO");
        expect(result.source).toBe("pre_transition");
    });

    it("never substitutes event date for a missing qualification class start", () => {
        const result = resolveProgram(
            {
                ...demoAqpResolutionInput,
                curriculumType: "QUAL",
                eventType: "QUALIFICATION",
                curriculumStartDate: undefined,
                cqCycleStartDate: undefined,
            },
            demoProgramCatalog,
        );

        expect(result.status).toBe("unresolved");
        expect(result.errors.join(" ")).toMatch(/requires curriculumStartDate/);
    });

    it("makes a missing CQ cycle commencement visible and requires review", () => {
        const result = resolveProgram(
            {
                ...demoAqpResolutionInput,
                curriculumStartDate: undefined,
                cqCycleStartDate: undefined,
            },
            demoProgramCatalog,
        );

        expect(result.status).toBe("needs_review");
        expect(result.warnings.join(" ")).toMatch(/cycle start was unavailable/i);
    });
});
