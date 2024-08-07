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
  AppBar,
  Toolbar,
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
      setSearchResult("Quantity: ", item.quantity);
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

  // function that triggers a click event on a file input element.
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      // this opens the file selection dialog
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
          // setOpenUpload(true);
        }
      };
    }
  };

  const handleTakePhoto = () => {
    if (camera.current) {
      // Capture the photo using the camera reference
      const photo = camera.current.takePhoto();
      setImage(photo);
      handleCloseCamera(true);
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

  return (
    <Box
      display={"flex"}
      height={"100vh"}
      width={"100vw"}
      sx={{ paddingX: 3, paddingY: 2, gap: 4 }}
      flexDirection={"column"}
      alignItems={"center"}
      backgroundColor={"#1B1B1B"}
    >
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#1B1B1B",
        }}
      >
        <Toolbar>
          {/* Style the header text */}
          <Typography variant={"h4"} color={"#fff"} sx={{ flexGrow: 1 }}>
            Pantry Tracker
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* ADD BUTTON */}
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
            {/* Search button */}
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
          </Box>
        </Toolbar>
      </AppBar>
      {/* Modal for Camera */}
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
              Camera
            </Typography>
            <Box
              sx={{
                width: "100%",
                height: "350px",
                position: "relative",
              }}
            >
              <Camera ref={camera} style={{ width: "100%", height: "auto" }} />
            </Box>
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
          </Stack>
        </Box>
      </Modal>
      {/* Search Button Modal*/}
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
      {/* ADD BUTTON modal*/}
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
          {/* The view of the modal is a stack which has a bar for user to type in item name and also select buttons */}
          <Stack width="100%" direction={"column"} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            {/* Button to upload photo */}
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

            {/* Button to open camera */}
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
            {/* When the button "add" inside the modal is clicked, call addItem and setItemName function */}
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
                image || selectedImage
                  ? image
                    ? handleUploadToFirebase(itemName, image)
                    : handleUploadToFirebase(itemName, selectedImage)
                  : addItem(itemName);
                setImage(null);
                setSelectedImage(null);
                setItemName(""); // Clear item name field, once add item button is clicked

                handleCloseAdd();
              }}
              disabled={!itemName} // Disable button if item name is empty
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      {/* Items displayed in a grid*/}
      <Grid container spacing={3}>
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
    </Box>
  );
}
