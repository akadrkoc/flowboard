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
    completedAt: String
    createdAt: String
    deletedAt: String
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

  type Sprint {
    id: ID!
    name: String!
    boardId: ID!
    startDate: String!
    endDate: String!
    isActive: Boolean!
  }

  type Comment {
    id: ID!
    text: String!
    cardId: ID!
    authorId: ID
    authorName: String!
    authorImage: String
    createdAt: String!
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
    comments(cardId: ID!): [Comment!]!
    boardMembers(boardId: ID!): [User!]!
    sprints(boardId: ID!): [Sprint!]!
    activeSprint(boardId: ID!): Sprint
  }

  type Mutation {
    createBoard(name: String!): Board!
    createCard(columnId: ID!, input: CardInput!): Card!
    moveCard(cardId: ID!, toColumnId: ID!, newIndex: Int!): Card!
    updateCard(cardId: ID!, input: CardInput!): Card!
    deleteCard(cardId: ID!): Boolean!
    restoreCard(cardId: ID!): Card!
    addColumn(boardId: ID!, name: String!): Column!
    renameColumn(columnId: ID!, name: String!): Column!
    deleteColumn(columnId: ID!): Boolean!
    inviteMember(boardId: ID!, email: String!): Board!
    removeMember(boardId: ID!, userId: ID!): Board!
    addComment(cardId: ID!, text: String!): Comment!
    createSprint(boardId: ID!, name: String!, startDate: String!, endDate: String!): Sprint!
    completeSprint(sprintId: ID!): Sprint!
  }
`;
