/**
 *
 * Data List. Observe changes to a list structure
 *
 * Enforcing
 *
 */

import { isEqual, isFunction } from '../is';
import { objectAlias, objectEach, objectExtract, objectFlatten, objectObserve, objectProxy } from '../object';
import { typeSwitch } from '../type';

type List<T> = { [key: string]: Entry<T> };
type Entry<T> = { [key in keyof T]: Entry<T[key]> };
type Handler<T> = () => T;
type DataList = <T extends {}>(list: { [key: string]: any }, structure: T) => Handler<T> & List<T>;

export const dataList: DataList = (list: any, structure) => {
  // Observing Object Changes
  const observedData = objectObserve(list, ({ method, value, current, path }) => {
    if (isEqual(method, 'set')) {
      // For Triggering callback
      const triggerCallback = ({ key, pointer, value: v }: any) => {
        // Getting the callback (if there is any)
        const callback = objectExtract(structure, pointer);
        const id = path[0];
        if (isFunction(callback)) {
          const params = {
            id,
            // Also send the source list for whatever manipulation needed
            list,
            key,
            previous: current,
            value: v,
          };
          const args = objectAlias(params, {
            k: 'key',
            v: 'value',
            i: 'id',
            l: 'list',
            p: 'previous',
          });
          // Triggering callback
          callback(args);
        }
      };

      // Base on the type of value, process data logic
      typeSwitch(value, {
        // Special case for when value is an object
        object: () => {
          // Flattened it
          const flattened = objectFlatten(value);
          objectEach(flattened, ({ key, v }: any) => {
            const keyArray = path.slice();
            keyArray.push(key);
            const pointer = path.slice(1);
            pointer.push(key);

            triggerCallback({
              key: keyArray.join('.'),
              pointer: pointer.join('.'),
              value: v,
            });
          });
        },

        default: () => {
          triggerCallback({
            key: path.join('.'),
            pointer: path.splice(1).join('.'),
            value,
          });
        },
      });
    }
  });

  const handlerFunction = (request?: any) => {
    return typeSwitch(request, {
      // By Default. Return the Original Source List
      default: () => list,
    });
  };

  /** Proxy Function that Returned */
  const proxy = objectProxy(handlerFunction, {
    // On Get, return the observe data
    get: ({ k }) => observedData[k],
    set: ({ k, v }) => {
      // Updating the Observe Data with value
      observedData[k] = v;
    },
  });

  // Return the proxy object
  return proxy;
};
