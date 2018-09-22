
export const addTextTask = payload => ({
  type: 'add',
  task: {
    type: 'text',
    payload
  }
});