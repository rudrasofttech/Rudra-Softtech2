import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button, Form, Container, Row, Col } from 'react-bootstrap';
import { getCroppedImg } from '../utils/croputils';


const MAX_DIMENSION = 200;

const ImageUploaderWithCrop = ({ onImageCropped }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setImageSrc(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, MAX_DIMENSION);
            onImageCropped?.(croppedImage); // Base64 string
        } catch (err) {
            console.error('Crop failed:', err);
        }
    };

    return (
        <Container>
            <Form.Group controlId="formFile">
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
            </Form.Group>

            {imageSrc && (
                <>
                    <div style={{ position: 'relative', width: '100%', height: 300, marginTop: 20 }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropSize={{ width: MAX_DIMENSION, height: MAX_DIMENSION }}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>

                    <Row className="mt-3">
                        <Col xs={8}>
                            <Form.Range
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={(e) => setZoom(Number(e.target.value))}
                            />
                        </Col>
                        <Col xs={4}>
                            <Button variant="primary" onClick={handleCrop}>
                                Save
                            </Button>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default ImageUploaderWithCrop;