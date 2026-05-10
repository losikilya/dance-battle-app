import { resources, Resources } from '../../resources'

export const getResource = (key: Resources): string => resources[key]
