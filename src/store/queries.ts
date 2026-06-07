export const GET_BOARDS_LIST_QUERY = `
  query GetBoards {
    boards { id name }
  }
`;

export const CREATE_BOARD_MUTATION = `
  mutation CreateBoard($name: String!) {
    createBoard(name: $name) { id name }
  }
`;

export const GET_BOARD_QUERY = `
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
          completedAt
          createdAt
        }
      }
    }
  }
`;

export const CREATE_CARD_MUTATION = `
  mutation CreateCard($columnId: ID!, $input: CardInput!) {
    createCard(columnId: $columnId, input: $input) {
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
`;

export const MOVE_CARD_MUTATION = `
  mutation MoveCard($cardId: ID!, $toColumnId: ID!, $newIndex: Int!) {
    moveCard(cardId: $cardId, toColumnId: $toColumnId, newIndex: $newIndex) {
      id
      columnId
      order
    }
  }
`;

export const UPDATE_CARD_MUTATION = `
  mutation UpdateCard($cardId: ID!, $input: CardInput!) {
    updateCard(cardId: $cardId, input: $input) {
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
`;

export const DELETE_CARD_MUTATION = `
  mutation DeleteCard($cardId: ID!) {
    deleteCard(cardId: $cardId)
  }
`;

export const RESTORE_CARD_MUTATION = `
  mutation RestoreCard($cardId: ID!) {
    restoreCard(cardId: $cardId) {
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

export const ADD_COLUMN_MUTATION = `
  mutation AddColumn($boardId: ID!, $name: String!) {
    addColumn(boardId: $boardId, name: $name) {
      id
      name
      order
    }
  }
`;

export const RENAME_COLUMN_MUTATION = `
  mutation RenameColumn($columnId: ID!, $name: String!) {
    renameColumn(columnId: $columnId, name: $name) {
      id
      name
    }
  }
`;

export const DELETE_COLUMN_MUTATION = `
  mutation DeleteColumn($columnId: ID!) {
    deleteColumn(columnId: $columnId)
  }
`;

export const GET_COMMENTS_QUERY = `
  query GetComments($cardId: ID!) {
    comments(cardId: $cardId) {
      id
      text
      cardId
      authorName
      authorImage
      createdAt
    }
  }
`;

export const ADD_COMMENT_MUTATION = `
  mutation AddComment($cardId: ID!, $text: String!) {
    addComment(cardId: $cardId, text: $text) {
      id
      text
      cardId
      authorName
      authorImage
      createdAt
    }
  }
`;

export const GET_BOARD_MEMBERS_QUERY = `
  query GetBoardMembers($boardId: ID!) {
    boardMembers(boardId: $boardId) {
      id
      name
      email
      image
    }
  }
`;

export const INVITE_MEMBER_MUTATION = `
  mutation InviteMember($boardId: ID!, $email: String!) {
    inviteMember(boardId: $boardId, email: $email) {
      id
    }
  }
`;

export const REMOVE_MEMBER_MUTATION = `
  mutation RemoveMember($boardId: ID!, $userId: ID!) {
    removeMember(boardId: $boardId, userId: $userId) {
      id
    }
  }
`;

export const GET_SPRINTS_QUERY = `
  query GetSprints($boardId: ID!) {
    sprints(boardId: $boardId) {
      id
      name
      startDate
      endDate
      isActive
    }
    activeSprint(boardId: $boardId) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

export const CREATE_SPRINT_MUTATION = `
  mutation CreateSprint($boardId: ID!, $name: String!, $startDate: String!, $endDate: String!) {
    createSprint(boardId: $boardId, name: $name, startDate: $startDate, endDate: $endDate) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

export const COMPLETE_SPRINT_MUTATION = `
  mutation CompleteSprint($sprintId: ID!) {
    completeSprint(sprintId: $sprintId) {
      id
      name
      isActive
    }
  }
`;
