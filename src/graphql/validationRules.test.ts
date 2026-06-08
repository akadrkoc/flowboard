import { describe, expect, it } from "vitest";
import { buildSchema, parse, validate } from "graphql";
import { createDepthLimitRule } from "./validationRules";

const schema = buildSchema(`
  type Query {
    board(id: ID!): Board
    boards: [Board!]!
  }
  type Board {
    id: ID!
    name: String!
    columns: [Column!]!
  }
  type Column {
    id: ID!
    cards: [Card!]!
  }
  type Card {
    id: ID!
    title: String!
  }
`);

describe("createDepthLimitRule", () => {
  it("rejects queries deeper than the configured limit", () => {
    const document = parse(`
      query DeepBoard {
        board(id: "1") {
          columns {
            cards {
              title
            }
          }
        }
      }
    `);

    const errors = validate(schema, document, [createDepthLimitRule(2)]);
    expect(errors.some((e) => e.message.includes("maximum depth"))).toBe(true);
  });

  it("allows shallow queries within the limit", () => {
    const document = parse(`
      query Boards {
        boards {
          id
          name
        }
      }
    `);

    const errors = validate(schema, document, [createDepthLimitRule(5)]);
    expect(errors).toHaveLength(0);
  });
});
