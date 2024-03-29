import { accessorReferenceFunction } from '../accessor/reference';
import { arrayEach } from '@library/presource/js/array/each';
import { isEqual } from '@library/presource/js/is/equal';

type Arguments = {
  id: string;
  field?: string;
  root: any;
};
type Structure = (args: Arguments) => any;

export const handlerGetFunction: Structure = ({ root, id, field }) => {
  // Get a list of all descendants
  const list = [root].concat(root.descendants());

  const context = arrayEach(list, ({ v }) => {
    // Getting the data
    const data = v.data();

    // Checking if data name is equal to the search id
    // If it is, return the context object
    if (isEqual(data.name, id)) return data.context;
  });

  // Context must exist for the reference function be returned. Else. return null
  return context ? accessorReferenceFunction({ context, field }) : () => null;
};
