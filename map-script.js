/**
 * Nexus Clash Breath 5 Map Script v0.1
 * written by plscks with exception to the original hypermap
 * functions which were written by Thalanor for the original hypermap
 */
(function () {
    'use strict';

    // Loads the initial map
    setMapData(window.cur_plane);

    // Gives the credits button a little style
    const panel = document.querySelector('.panel');
    panel.classList.add('bg-body');
    const credits = document.querySelector('.bottom-note');
    credits.classList.add('text-secondary');

   /**
    * Change to the appropriate map when clicking the buttons
    */
    $('.btn').on('click', (e) => {
      if (!e.target.value) {
        return;
      }
      //console.log(`clicked value: ${e.target.value}`);
      $('canvas#map').css('background-image', `url(${window.mapDim[e.target.value].link})`).css('width', window.mapDim[e.target.value].x).css('height', window.mapDim[e.target.value].y);
      window.cur_plane = e.target.value;
      setMapData(window.cur_plane);
    });


   /**
    * Update the map tooltip when the cursor position moves
    */
    $('canvas#map').on('mousemove', function (e) {
        const X = Math.floor((e.offsetX) / 24) + window.mapDim[window.cur_plane].x_offset;
        const Y = Math.floor((e.offsetY) / 24) + window.mapDim[window.cur_plane].y_offset;
        const toolHalfHeight = $('div#tooltip').outerHeight() / 2;
        const encode_loc = encodeLocation(X, Y, window.cur_plane);
        //console.log(`X: ${X} (${e.offsetX}) Y: ${Y} (${e.offsetY}) | ${isValid(encode_loc)} | encoded_loc: ${encode_loc}`);
        if (isValid(encode_loc)) {
          $('div#tooltip').css('left', Math.floor(e.pageX)+12 ).css('top', Math.floor(e.pageY - toolHalfHeight)-12).css('display', 'flex').text(getTileText(X, Y, encode_loc)).addClass('btn btn-primary btn-sm');
        } else {
          $('div#tooltip').css('display', 'none');
        }
    });


    /**
     * Sets the correct map data in the window object
     * @param {Number} planeID - The ID of the plane data to set
     */
    async function setMapData(planeID) {
      window.tiledata = {};
      await d3.csv(`js/${planeID}.csv`, function (d) {
        window.tiledata[parseInt(d.coord_enc)] = {
          tilename: d.tilename,
          tilebase: d.tile_base
        };
      });
    }


    /**
     * Returns a string for the tool tip text
     * @param {Number} x - 'X' coordinate of tile
     * @param {Number} y - 'Y' coordinate of tile
     * @param {Number} encoded_loc - Encoded tile value for getting the tile data
     * @returns {String} The string that contains the tool tip text for a given coordinate
     */
    function getTileText(x, y, encoded_loc) {
      const tilename = window.tiledata[encoded_loc].tilename;
      const tiletype = window.tiledata[encoded_loc].tilebase;
      return `(${x}, ${y}) ${tilename}, ${select_article(tiletype)} ${tiletype}`
    }


    /**
     * Takes an encoded tile value and determines if it is a valid tile or not.
     * @param {Number} encoded_loc - Encoded tile value to be evaluated
     * @returns {Boolean} Returns true or false depending on validity of tile
     */
    function isValid(encoded_loc) {
       return (window.tiledata[encoded_loc] !== undefined);
    }


    /**
     * Returns the encoded value of a given x, y, z coordinate.
     * @param {Number} x - x coordinate
     * @param {Number} y - y coordinate
     * @param {Number} z - z coordinate
     * @returns {Number} Encoded value of the given x, y, z coordinate
     */
    function encodeLocation(x,y,z) {
        return x + y*72 + z*3600;
    }


    /**
     * Decodes a numerical value back into x, y, z coordinates. Currently, unused but that may change in the future
     * @param {Number} val - Integer value to be decoded
     * @returns {Any[]} Returns result array where result[0]=coord_x, result[1]=coord_y, and result[2]=coord_z
     */
    function decodeLocation(val) {
        const result = new Array(3);
        result[2] = Math.floor(val/3600);
        result[1] = Math.floor((val-result[2]*3600)/72);
        result[0] = Math.floor((val-result[1]*72)%72);
        return result;
    }


    /**
     * Determines the appropriate article to use preceding a given word.
     * @param {String} word - The word to check against
     * @returns {String} The article to be used for the given word 'a' or 'an'
     */
    function select_article(word) {
      const first_letter = word[0].toLowerCase();
      const an_letters = ['a', 'e', 'i', 'o', 'u'];
      return (an_letters.includes(first_letter)) ? 'an' : 'a';
    }


}());