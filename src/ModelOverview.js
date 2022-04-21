import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'reactstrap';
import Backend from './services/backend';
import { useKeycloak } from '@react-keycloak/web';
import ModelsTable from './components/ModelsTable';
import {
  CLASSIFICATION_COLUMNS,
  MODEL_TYPES,
  SURVIVAL_COLUMNS,
} from './config/constants';

export default function ModelOverview({ albums }) {
  const history = useHistory();

  const { keycloak } = useKeycloak();

  const [models, setModels] = useState([]);
  const [collections, setCollections] = useState([]);

  const { albumID } = useParams();

  const collectionColumn = useMemo(
    () => ({
      Header: 'Collection',
      accessor: (r) => {
        const collection = collections.find(
          (c) => c.id === r.feature_collection_id
        );

        return collection ? collection.name : '<original>';
      },
    }),
    [collections]
  );

  // Model table header
  const columnsClassification = React.useMemo(
    () => [collectionColumn, ...CLASSIFICATION_COLUMNS],
    [collectionColumn]
  );
  const columnsSurvival = React.useMemo(
    () => [collectionColumn, ...SURVIVAL_COLUMNS],
    [collectionColumn]
  );

  useEffect(() => {
    async function fetchModels() {
      let models = await Backend.models(keycloak.token, albumID);

      setModels(models);
    }

    fetchModels();
  }, [keycloak.token, albumID]);

  // Get collections
  useEffect(() => {
    async function getCollections() {
      const latestExtraction = await Backend.extractions(
        keycloak.token,
        albumID
      );

      const collections = await Backend.collectionsByExtraction(
        keycloak.token,
        latestExtraction.id
      );

      setCollections(collections.map((c) => c.collection));
    }

    getCollections();
  }, [albumID, keycloak.token]);

  const album = albums.find((a) => a.album_id === albumID);

  const handleDeleteModelClick = async (id) => {
    await Backend.deleteModel(keycloak.token, id);
    setModels(models.filter((model) => model.id !== id));
  };

  return (
    albums.length > 0 && (
      <div>
        <h1>
          Model Overview for <strong>{album.name}</strong> album
        </h1>
        <div
          className="d-flex flex-column justify-content-start align-items-start tab-content"
          style={{ borderTop: '1px solid #dee2e6' }}
        >
          <Button
            color="link"
            onClick={() => history.push(`/features/${albumID}/overview`)}
          >
            <FontAwesomeIcon icon="arrow-left" /> Go Back
          </Button>

          {models.length > 0 ? (
            <div style={{ width: '98%' }}>
              <ModelsTable
                title="Classification Models"
                columns={columnsClassification}
                data={models.filter(
                  (m) => m.type === MODEL_TYPES.CLASSIFICATION
                )}
                handleDeleteModelClick={handleDeleteModelClick}
              />
              <ModelsTable
                title="Survival Models"
                columns={columnsSurvival}
                data={models.filter((m) => m.type === MODEL_TYPES.SURVIVAL)}
                handleDeleteModelClick={handleDeleteModelClick}
              />
            </div>
          ) : (
            <h2 className="align-self-stretch">No Models Created Yet</h2>
          )}
        </div>
      </div>
    )
  );
}
