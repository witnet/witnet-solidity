module.exports = {
    /// path: { ... path: {
    /////// FORMULA 1 ////////////////////////////////////////////////////////////////////////        
    ///     WitnetRequestXXX: {
    ///         args: [ [ .. ], ... ], 
    ///         template: WitnetRequestTemplateYYY // within migrations/witnet/templates
    ///     },
    ///     // ...
    /////// FORMULA 2 ////////////////////////////////////////////////////////////////////////        
    ///     WitnetRequestZZZ: {
    ///         retrievals: [
    ///             'unique-resource-name'          // => within assets/witnet/radons.retrievals
    ///             ...,
    ///         ],
    ///         aggregator: 'unique-resource-name'  // => within assets/witnet/radons.reducers
    ///         tally: 'unique-resource-name'       // => within assets/witnet/radons.reducers
    ///      }
    ///     // ...
    /// }, 
};