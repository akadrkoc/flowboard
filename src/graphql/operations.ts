import { gql } from "@apollo/client";

export const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      name
      columns {
        id
        name
        order
        cards {
          id
          title
          description
          labels
          priority
          dueDate
          storyPoints
          assigneeInitials
          assigneeColor
          columnId
          order
        }
      }
    }
  }
`;

export const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      name
    }
  }
`;

export const CREATE_BOARD = gql`
  mutation CreateBoard($name: String!) {
    createBoard(name: $name) {
      id
      name
      columns {
        id
        name
        order
        cards {
          id
          title
          labels
          priority
          dueDate
          storyPoints
          assigneeInitials
          assigneeColor
          columnId
          order
        }
      }
    }
  }
`;

export const CREATE_CARD = gql`
  mutation CreateCard($columnId: ID!, $input: CardInput!) {
    createCard(columnId: $columnId, input: $input) {
      id
      title
      description
      labels
      priority
      dueDate
      storyPoints
      assigneeInitials
      assigneeColor
      columnId
      order
    }
  }
`;

export const MOVE_CARD = gql`
  mutation MoveCard($cardId: ID!, $toColumnId: ID!, $newIndex: Int!) {
    moveCard(cardId: $cardId, toColumnId: $toColumnId, newIndex: $newIndex) {
      id
      columnId
      order
    }
  }
`;

export const UPDATE_CARD = gql`
  mutation UpdateCard($cardId: ID!, $input: CardInput!) {
    updateCard(cardId: $cardId, input: $input) {
      id
      title
      description
      labels
      priority
      dueDate
      storyPoints
      assigneeInitials
      assigneeColor
      columnId
      order
    }
  }
`;

export const DELETE_CARD = gql`
  mutation DeleteCard($cardId: ID!) {
    deleteCard(cardId: $cardId)
  }
`;
