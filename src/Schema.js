export const schema = {
    title: 'Anonymous chat schema',
    description: 'Databased schema for an anonymous chat',
    version: 0,
    properties: {
        id: {
            type: 'string',
            primary: true
        },
        message: {
            type: 'string'
        }
    },
    required: ['message']
}