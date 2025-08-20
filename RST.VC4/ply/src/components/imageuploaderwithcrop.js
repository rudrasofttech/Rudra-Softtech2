import React, { useState } from 'react';
import { Button, Form, Container } from 'react-bootstrap';
import { scaleImageToFit } from '../utils/croputils';

const ImageUploader = ({ maxWidth = 400, maxHeight = 300, onImageLoaded }) => {
    const [scaledImage, setScaledImage] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async () => {
                const scaled = await scaleImageToFit(reader.result, maxWidth, maxHeight);
                setScaledImage(scaled);
                //onImageLoaded?.(scaled);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Container>
            <Form.Group controlId="formFile">
                <Form.Label>Select an image</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
            </Form.Group>

            {scaledImage && (
                <div className="mt-3">
                    <img
                        src={scaledImage}
                        alt="Loaded Preview"
                        style={{ maxWidth: '100%', border: '1px solid #ccc' }}
                    />
                    <div>
                        <Button variant="primary" className="mt-2" onClick={() => onImageLoaded?.(scaledImage)}>
                            Use This Image
                        </Button>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default ImageUploader;

//import React, { useState, useCallback } from 'react';
//import Cropper from 'react-easy-crop';
//import { Button, Form, Container, Row, Col } from 'react-bootstrap';
//import { getCroppedImg, scaleImageToFit } from '../utils/croputils';

//const ImageUploaderWithCrop = ({ onImageCropped, maxWidth = 300, maxHeight = 200 }) => {
//    const [imageSrc, setImageSrc] = useState(null);
//    const [crop, setCrop] = useState({ x: 0, y: 0 });
//    const [zoom, setZoom] = useState(1);
//    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

//    const aspectRatio = maxWidth / maxHeight;

//    const onCropComplete = useCallback((_, croppedPixels) => {
//        setCroppedAreaPixels(croppedPixels);
//    }, []);

//    const handleFileChange = async (e) => {
//        const file = e.target.files[0];
//        if (file && file.type.startsWith('image/')) {
//            const reader = new FileReader();
//            reader.onload = async () => {
//                const scaledImage = await scaleImageToFit(reader.result, maxWidth, maxHeight);
//                setImageSrc(scaledImage);
//            };
//            reader.readAsDataURL(file);
//        }
//    };


//    const handleCrop = async () => {
//        try {
//            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, maxWidth, maxHeight);
//            onImageCropped?.(croppedImage);
//        } catch (err) {
//            console.error('Crop failed:', err);
//        }
//    };

//    return (
//        <Container>
//            <Form.Group controlId="formFile">
//                <Form.Label>Select an image</Form.Label>
//                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
//            </Form.Group>

//            {imageSrc && (
//                <>
//                    <div
//                        style={{
//                            position: 'relative',
//                            width: maxWidth,
//                            height: maxHeight,
//                            marginTop: 20,
//                            border: '1px solid #ccc',
//                            overflow: 'hidden',
//                        }}
//                    >
//                        <Cropper
//                            image={imageSrc}
//                            crop={crop}
//                            zoom={zoom}
//                            aspect={aspectRatio}
//                            onCropChange={setCrop}
//                            onZoomChange={setZoom}
//                            onCropComplete={onCropComplete}
//                        />
//                    </div>

//                    <Row className="mt-3 align-items-center">
//                        <Col xs={8}>
//                            <Form.Range
//                                value={zoom}
//                                min={0.1}
//                                max={3}
//                                step={0.1}
//                                onChange={(e) => setZoom(Number(e.target.value))}
//                            />
//                        </Col>
//                        <Col xs={4}>
//                            <Button variant="primary" onClick={handleCrop}>
//                                Save
//                            </Button>
//                        </Col>
//                    </Row>
//                </>
//            )}
//        </Container>
//    );
//};

//export default ImageUploaderWithCrop;