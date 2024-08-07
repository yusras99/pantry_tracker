// The below command states that this is a client side component and run on client side
"use client";

require("dotenv").config();
import { useState, useEffect, useRef } from "react";
import { Camera } from "react-camera-pro";
import {
  Box,
  Stack,
  Typography,
  Button,
  Modal,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
// Firebase is an online No SQL database
import { storage, firestore } from "@/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

// Style for Modal that opens up when addItem button is clicked
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "white",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

export default function Home() {
  // We'll add our component logic here
  // State variables below will manage our inventory list, modal state, and new item input respectively.
  // in each line of code:
  // the first value in the list e.g. inventory is a state variable.
  // The second variable is the function that updates state variable.
  // useState initializes the state variable with the value inside the parenthesis
  const [inventory, setInventory] = useState([]);
  const [openSearch, setOpenSearch] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [itemName, setItemName] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const camera = useRef(null);
  const [image, setImage] = useState(null);
  const [openCamera, setOpenCamera] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  // The `useEffect` hook ensures this runs when the component mounts.
  useEffect(() => {
    updateInventory();
  }, []);

  // Fetch each inventory data from firestore database
  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot); //this command grabs all items from database
    const inventoryList = [];
    docs.forEach((doc) => {
      //now for each item push it into a list and set the inventory
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  const searchInventory = (itemName) => {
    // make the item case insensitive and find it in inventory
    const item = inventory.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase()
    );
    // if it is found, return its quantity else, return the string item not found.
    if (item) {
      setSearchResult(item.quantity);
    } else {
      setSearchResult("Item not found");
    }
  };
  // Function that interact with Firestore to add items and update our local state.
  const addItem = async (item) => {
    const formattedItemName = item.toLowerCase();
    const docRef = doc(collection(firestore, "inventory"), formattedItemName);
    const docSnap = await getDoc(docRef);
    // If the item exists already, add 1 to quantity else, make quantity =1.
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };
  // Function that interact with Firestore to remove items and update our local state.
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle the file input change event
  const handleImageChange = (e) => {
    // Ensure files are selected
    if (e.target.files && e.target.files[0]) {
      // Create a new FileReader instance
      const reader = new FileReader();

      // Read the file as a data URL
      reader.readAsDataURL(e.target.files[0]);

      // When the file has been read successfully, set the image state
      reader.onload = (readerEvent) => {
        if (readerEvent.target) {
          setSelectedImage(readerEvent.target.result);
          setOpenUpload(true);
        }
      };
    }
  };

  const handleTakePhoto = () => {
    if (camera.current) {
      // Capture the photo using the camera reference
      const photo = camera.current.takePhoto();
      setImage(photo);
    }
  };
  const handleUploadToFirebase = async (itemName, photo) => {
    if (!itemName || !photo) return;
    // Create a reference to a location in Firebase Storage where the image will be stored.
    // The image is named using the current timestamp to ensure uniqueness.
    const storageRef = ref(storage, `images/${Date.now()}.jpg`);
    try {
      await uploadString(storageRef, photo, "data_url");
      // Retrieves the download URL for the uploaded image. This URL will be stored in Firestore to reference the image
      const imageUrl = await getDownloadURL(storageRef);

      // await addItem(itemName, imageUrl);
      const docRef = doc(collection(firestore, "inventory"), itemName);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1, imageUrl });
      } else {
        await setDoc(docRef, { quantity: 1, imageUrl });
      }
      await updateInventory();
      alert("Image and item added successfully");
    } catch (error) {
      console.error("Error uploading image or adding item: ", error);
    }
  };

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleOpenSearch = () => setOpenSearch(true);
  const handleCloseSearch = () => setOpenSearch(false);

  const handleOpenCamera = () => setOpenCamera(true);
  const handleCloseCamera = () => setOpenCamera(false);

  const handleOpenUpload = () => setOpenUpload(true);
  const handleCloseUpload = () => setOpenUpload(false);

  return (
    <Box
      width="100vw"
      height="100vh"
      display={"flex"}
      justifyContent={"center"}
      flexDirection={"column"}
      alignItems={"center"}
      backgroundColor={"#1B1B1B"}
      gap={2}
    >
      <Stack
        width="100%"
        direction={"row"}
        justifyContent={"center"}
        spacing={2}
      >
        {/* Camera button */}
        <Modal
          open={openCamera}
          onClose={handleCloseCamera}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          {/* style the whole modal using box container */}
          <Box
            sx={{
              height: "600px",
              maxWidth: "600px",
              p: 2,
              mx: "auto",
              mt: "10%",
              bgcolor: "background.paper",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            {/* Add a stack to put all the children in a vertical manner */}
            <Stack spacing={2} alignItems="center">
              {/* Heading on the modal is Captured Photo when image is taken else heading is Camera */}
              <Typography id="modal-modal-title" variant="h6" component="h2">
                {image ? "Captured Photo" : "Camera"}
              </Typography>

              {/* If image is captured then the display should be as follows*/}
              {image ? (
                <Box sx={{ mt: 2 }}>
                  {/* Display the captured photo */}
                  <img
                    src={image}
                    alt="Captured"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />

                  {/* Input field for item name and button to add the item */}
                  <Stack
                    direction={"row"}
                    justifyContent={"center"}
                    spacing={2}
                    sx={{ mt: 2 }}
                  >
                    <TextField
                      label="Item Name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      sx={{
                        border: "4px solid #f89090",
                        backgroundColor: "#676767", // Custom background color
                        color: "#FFFFFF", // Custom text color
                        "&:hover": {
                          backgroundColor: "#f89090", // Custom hover background color
                        },
                      }}
                      onClick={() => {
                        handleUploadToFirebase(itemName, image);
                        setItemName(""); // Clear item name field, once add item button is clicked
                        handleCloseCamera(true); // Close the camera modal
                      }}
                      disabled={!itemName} // Disable button if item name is empty
                    >
                      Add Item
                    </Button>
                  </Stack>
                </Box>
              ) : (
                // when the picture is not taken, display the camera
                // Wrap the camera in a box to style the area.
                <Box
                  sx={{
                    width: "100%",
                    height: "350px",
                    position: "relative",
                  }}
                >
                  <Camera
                    ref={camera}
                    style={{ width: "100%", height: "auto" }}
                  />
                </Box>
              )}
              {/* Take photo button is only visible when camera is displayed */}
              {!image && (
                <Button
                  variant="contained"
                  sx={{
                    border: "4px solid #f89090",
                    backgroundColor: "#676767", // Custom background color
                    color: "#FFFFFF", // Custom text color
                    "&:hover": {
                      backgroundColor: "#f89090", // Custom hover background color
                    },
                  }}
                  onClick={handleTakePhoto}
                >
                  Take Photo
                </Button>
              )}
            </Stack>
          </Box>
        </Modal>

        {/* Button to open the camera modal */}
        <Button
          variant="contained"
          sx={{
            border: "4px solid #f89090",
            backgroundColor: "#676767", // Custom background color
            color: "#FFFFFF", // Custom text color
            "&:hover": {
              backgroundColor: "#f89090", // Custom hover background color
            },
          }}
          onClick={handleOpenCamera}
        >
          Take Photo
        </Button>

        {/* Upload Photo */}
        <Modal
          open={openUpload}
          onClose={handleCloseUpload}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box
            sx={{
              height: "600px",
              maxWidth: "600px",
              p: 2,
              mx: "auto",
              mt: "10%",
              bgcolor: "background.paper",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            {/* Add a stack to put all the children in a vertical manner */}
            <Stack spacing={2} alignItems="center">
              {/* Heading on the modal is Captured Photo when image is taken else heading is Camera */}
              <Typography id="modal-modal-title" variant="h6" component="h2">
                {image ? "Captured Photo" : "Camera"}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {/* Display the captured photo */}
                <img
                  src={selectedImage}
                  alt="Uploaded"
                  style={{ maxWidth: "100%", height: "auto" }}
                />

                {/* Input field for item name and button to add the item */}
                <Stack
                  direction={"row"}
                  justifyContent={"center"}
                  spacing={2}
                  sx={{ mt: 2 }}
                >
                  <TextField
                    label="Item Name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      handleUploadToFirebase(itemName, image);
                      setItemName(""); // Clear item name field, once add item button is clicked
                      handleCloseUpload(true); // Close the camera modal
                    }}
                    disabled={!itemName} // Disable button if item name is empty
                  >
                    Add Item
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Modal>
        <Button
          variant="contained"
          sx={{
            border: "4px solid #f89090",
            backgroundColor: "#676767", // Custom background color
            color: "#FFFFFF", // Custom text color
            "&:hover": {
              backgroundColor: "#f89090", // Custom hover background color
            },
          }}
          onClick={handleUploadClick}
        >
          Upload Photo
        </Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        {/* Search Button */}
        <Modal
          open={openSearch}
          onClose={handleCloseSearch}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            {/* Heading on the modal */}
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Search
            </Typography>
            {/* The view of the modal is a stack which has a bar for user to type in item name and press button "add" */}
            <Stack width="100%" direction={"row"} spacing={2}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              {/* When the button "search" inside the modal is clicked, call searchInventory function */}
              <Button
                variant="outlined"
                sx={{
                  border: "4px solid #f89090",
                  backgroundColor: "#676767", // Custom background color
                  color: "#FFFFFF", // Custom text color
                  "&:hover": {
                    backgroundColor: "#f89090", // Custom hover background color
                  },
                }}
                onClick={() => {
                  searchInventory(itemName);
                }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                sx={{
                  border: "4px solid #f89090",
                  backgroundColor: "#676767", // Custom background color
                  color: "#FFFFFF", // Custom text color
                  "&:hover": {
                    backgroundColor: "#f89090", // Custom hover background color
                  },
                }}
                onClick={() => {
                  handleCloseSearch();
                  setSearchResult("");
                }}
              >
                Done
              </Button>
            </Stack>
            {searchResult !== null && (
              <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                {searchResult}
              </Typography>
            )}
          </Box>
        </Modal>
        <Button
          variant="contained"
          sx={{
            border: "4px solid #f89090",
            backgroundColor: "#676767", // Custom background color
            color: "#FFFFFF", // Custom text color
            "&:hover": {
              backgroundColor: "#f89090", // Custom hover background color
            },
          }}
          onClick={handleOpenSearch}
        >
          Search Item
        </Button>

        {/* Add button */}
        {/* modal is something that pops up when something is clicked, this one opens when add item button is clicked */}
        <Modal
          open={openAdd}
          onClose={handleCloseAdd}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add Item
            </Typography>
            {/* The view of the modal is a stack which has a bar for user to type in item name and press button "add" */}
            <Stack width="100%" direction={"row"} spacing={2}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              {/* When the button "add" inside the modal is clicked, call addItem and setItemName function */}
              <Button
                variant="outlined"
                onClick={() => {
                  addItem(itemName);
                  setItemName("");
                  handleCloseAdd();
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Button
          variant="contained"
          sx={{
            border: "4px solid #f89090",
            backgroundColor: "#676767", // Custom background color
            color: "#FFFFFF", // Custom text color
            "&:hover": {
              backgroundColor: "#f89090", // Custom hover background color
            },
          }}
          onClick={handleOpenAdd}
        >
          Add New Item
        </Button>
      </Stack>
      {/* The box containing border and inventory items */}
      <Box border={"1px solid #333"}>
        {/* The header box */}
        <Box
          width="800px"
          height="100px"
          bgcolor={"#f89090"}
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
        >
          {/* Style the header text */}
          <Typography variant={"h2"} color={"#fff"} textAlign={"center"}>
            Inventory Items
          </Typography>
        </Box>
        {/* Create a list of scrollable items using stack. stack will display them vertically */}
        {/* <Stack width="800px" height="300px" spacing={2} overflow={"auto"}> */}
        <Grid container spacing={2}>
          {inventory.map(({ name, quantity, imageUrl }) => (
            // xs, sm, md, lg => the grid item will take up all 12, 6, 4, 2 columns of the grid
            // when the screen size is extra small, small, medium and large
            <Grid item key={name} xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  height: "300px", // Set a fixed height
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {imageUrl ? (
                  <CardMedia
                    component="img"
                    height="150"
                    image={imageUrl}
                    alt={name}
                  />
                ) : (
                  <CardMedia
                    component="div"
                    height="150"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f0f0f0",
                      color: "#666",
                    }}
                  >
                    No image available
                  </CardMedia>
                )}
                <CardContent>
                  <Typography variant="h6" component="div" textAlign={"center"}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    textAlign={"center"}
                  >
                    Quantity: {quantity}
                  </Typography>
                  <Box display="flex" justifyContent="center" marginTop={2}>
                    <Button
                      variant="contained"
                      sx={{
                        border: "4px solid #f89090",
                        backgroundColor: "#676767", // Custom background color
                        color: "#FFFFFF", // Custom text color
                        "&:hover": {
                          backgroundColor: "#f89090", // Custom hover background color
                        },
                      }}
                      onClick={() => removeItem(name)}
                    >
                      Remove
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {/* </Stack> */}
      </Box>
    </Box>
  );
}
