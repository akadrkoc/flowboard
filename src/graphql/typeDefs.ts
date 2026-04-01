export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String!
    image: String
    provider: String!
  }

  type Card {
    id: ID!
    title: String!
    description: String
    labels: [String!]!
    priority: String!
    dueDate: String
    storyPoints: Int!
    assigneeId: ID
    assigneeInitials: String!
    assigneeColor: String!
    columnId: ID!
    boardId: ID!
    order: Int!
  }

  type Column {
    id: ID!
    name: String!
    boardId: ID!
    order: Int!
    cards: [Card!]!
  }

  type Board {
    id: ID!
    name: String!
    ownerId: ID!
    memberIds: [ID!]!
    columns: [Column!]!
  }

  input CardInput {
    title: String
    description: String
    labels: [String!]
    priority: String
    dueDate: String
    storyPoints: Int
    assigneeInitials: String
    assigneeColor: String
  }

  type Query {
    boards: [Board!]!
    board(id: ID!): Board
    me: User
  }

  type Mutation {
    createBoard(name: String!): Board!
    createCard(columnId: ID!, input: CardInput!): Card!
    moveCard(cardId: ID!, toColumnId: ID!, newIndex: Int!): Card!
    updateCard(cardId: ID!, input: CardInput!): Card!
    deleteCard(cardId: ID!): Boolean!
    inviteMember(boardId: ID!, email: String!): Board!
  }
`;
