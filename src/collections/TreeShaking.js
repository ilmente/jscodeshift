/*
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const _ = require('lodash');
const Collection = require('../Collection');
const matchNode = require('../matchNode');
const recast = require('recast');
const Node = recast.types.namedTypes.Node;
let types = recast.types.namedTypes;

const treeShaking = {
    first: function (type, filterPredicate) {
        const matchingPaths = new Map();
        const visitorMethodName = 'visit' + type;

        this.__paths.forEach(function (mainPath) {
            let path = mainPath.parentPath;

            const visitors = {
                visitNode: function (currentPath) {
                    if (!matchingPaths.has(mainPath) && path.parentPath) {
                        path = path.parentPath;
                        this.traverse(path);
                    }

                    return false;
                }
            };

            visitors[visitorMethodName] = function (currentPath) { 
                if (matchingPaths.has(mainPath)) { 
                    return false;
                }

                const match = !!filterPredicate ? filterPredicate(mainPath, currentPath) : true;

                if (match) {
                    matchingPaths.set(mainPath, currentPath);
                }

                return false;
            };

            recast.visit(path, visitors);
        }, this);

        return Collection.fromPaths(Array.from(matchingPaths.values()), this, type);
    },

    mark: function () { 
        this.__paths.forEach(function (path) { 
            path.keep = true;
        });
    }
};

function register() {
    Collection.registerMethods(treeShaking, Node);
    Collection.setDefaultCollectionType(Node);
}

exports.register = _.once(register);
