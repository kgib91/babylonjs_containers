# babylonjs_containers

*Note* The babylon gui doesn't seem to easily support z-sorting with 3d labels which are clustered together, it also does not have a good default implementation of spreading the labels away when zooming out, I do not have enough time to implement this
*Note* Resizing is supported only by a single corner closest to camera on initial load

Instructions:
1. The corner closest to camera on load will be draggable and should adjust the size as you might expect. Holding 'shift' while re-sizing will allow you to resize with grid snapping.
2. Clicking on the label will open a "Change Label" modal, where after clicking Save Changes, any value entered in the text field will be set to the label of the box.
3. May pan around the scene using right-mouse click/drag
4. May orbit around the center with default mouse-click/orbit-controls. 
